import dbConnect from "@/utils/dbConnect";
import User from "@/models/userModel";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
    await dbConnect();

    try {
        const cookieStore = await cookies();
        const linkedinProfileCookie = cookieStore.get('linkedin_profile')?.value;

        if (!linkedinProfileCookie) {
            return NextResponse.json(
                { message: "Authentication required. Please sign in with LinkedIn." },
                { status: 401 }
            );
        }

        const linkedinProfile = JSON.parse(linkedinProfileCookie);
        const linkedinId = linkedinProfile.linkedinId;

        // Check if user exists
        const user = await User.findOne({ linkedinId });
        
        if (!user) {
            return NextResponse.json(
                { message: "User not found. Please complete your profile setup." },
                { status: 404 }
            );
        }

        // Get plan type from request body
        const { planType } = await req.json();

        if (!['monthly', 'yearly'].includes(planType)) {
            return NextResponse.json(
                { message: "Invalid plan type. Choose either 'monthly' or 'yearly'." },
                { status: 400 }
            );
        }

        // Plan configurations based on selected plan type
        const planConfig = {
            monthly: {
                planId: "monthlyPremium",
                amount: 800,
                planName: "premiumMonthly",
                interval: 1,
                intervalType: "month",
                description: "Monthly Premium Subscription"
            },
            yearly: {
                planId: "yearlyPremium",
                amount: 8400, // 700 Rs/month * 12 months
                planName: "premiumYearly",
                interval: 1,
                intervalType: "year",
                description: "Yearly Premium Subscription"
            }
        };

        const selectedPlan = planConfig[planType];
        
        // Create a unique subscription ID with alphanumeric characters only
        const randomString = Math.random().toString(36).substring(2, 10);
        const subscriptionId = `sub${linkedinId.substring(0, 5)}${randomString}`;
        
        // Cashfree API credentials - using sandbox credentials for testing
        const appId = process.env.CASHFREE_APP_ID || "TEST94330432fc55c8570e96cf62a140334"; // Fallback to test ID
        const secretKey = process.env.CASHFREE_SECRET_KEY || "TEST71ef88e5412390b0d0c786a427a44652d414b940"; // Fallback to test key
        
        console.log("Using API credentials:", { appId, secretKeyPrefix: secretKey.substring(0, 10) + "..." });

        // Calculate end date based on plan
        const startDate = new Date();
        const endDate = new Date(startDate);
        if (planType === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Format expiry date for subscription (YYYY-MM-DD HH:MM:SS)
        const formattedExpiryDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            .toISOString().replace('T', ' ').slice(0, 19);

        console.log("Creating subscription with the following data:");
        
        // Return URL for subscription flow
        const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/subscription/status`;
        
        const requestBody = {
            subscriptionId: subscriptionId,
            customerName: `${user.firstName} ${user.lastName}`,
            customerPhone: "9876543210", // Default phone number
            customerEmail: user.email,
            returnUrl: returnUrl,
            authAmount: 1, // Authentication amount for subscription verification
            expiresOn: formattedExpiryDate,
            planInfo: {
                type: "PERIODIC",
                planName: selectedPlan.planName,
                amount: selectedPlan.amount,
                interval: selectedPlan.interval,
                intervalType: selectedPlan.intervalType.toUpperCase(), // MONTH or YEAR
                mandateAmount: selectedPlan.amount, // Updated to match recurring amount
                recurringAmount: selectedPlan.amount
            },
            notificationChannels: ["EMAIL"],
            remarks: `${planType} subscription for ${user.email}`
        };
        
        console.log(JSON.stringify(requestBody, null, 2));

        // Update to use the subscription API endpoint with proper header case
        const response = await fetch("https://api.cashfree.com/api/v2/subscriptions/nonSeamless/subscription", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Client-Id": appId,
                "X-Client-Secret": secretKey,
            },
            body: JSON.stringify(requestBody),
        });
        
        let responseText;
        try {
            responseText = await response.text();
            console.log("API Response Text:", responseText);
            
            // Parse response
            let data = {};
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Error parsing JSON response:", parseError);
                return NextResponse.json(
                    { 
                        success: false, 
                        message: "Failed to parse Cashfree API response", 
                        statusCode: response.status,
                        responseText
                    },
                    { status: 500 }
                );
            }
            
            if (!response.ok) {
                return NextResponse.json(
                    { 
                        success: false, 
                        message: "Failed to create subscription with Cashfree", 
                        statusCode: response.status,
                        details: data 
                    },
                    { status: response.status }
                );
            }

            // Save subscription details in user model
            user.subscription = {
                status: "pending",
                plan: selectedPlan.planName,
                startDate: startDate,
                endDate: endDate,
                subscriptionId: subscriptionId,
                subscriptionLink: data.subscriptionLink || data.paymentLink // Different response format in subscription API
            };
            
            await user.save();

            return NextResponse.json({
                success: true,
                subscriptionLink: data.subscriptionLink || data.paymentLink,
                subscriptionId: subscriptionId,
                message: "Subscription created. Please complete the authentication process."
            });
            
        } catch (err) {
            console.error("Error in API request:", err);
            return NextResponse.json(
                { 
                    success: false, 
                    message: "API request failed", 
                    error: err.message,
                    responseText: responseText || "No response received"
                },
                { status: 500 }
            );
        }
        
    } catch (err) {
        console.error("Error creating subscription:", err);
        return NextResponse.json(
            { success: false, message: "Failed to create subscription", error: err.message },
            { status: 500 }
        );
    }
}