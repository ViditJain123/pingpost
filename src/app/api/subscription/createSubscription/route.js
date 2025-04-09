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
        
        // Create a unique customer ID with alphanumeric characters only
        const customerId = `cust${linkedinId.substring(0, 5)}${randomString}`;
        
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

        // Format dates in the required format (YYYY-MM-DD)
        const formattedStartDate = startDate.toISOString().split('T')[0];
        // Use a more reasonable expiry time for testing (7 days instead of a year in the future)
        const formattedExpiryDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0] + 'T23:59:59Z';

        console.log("Creating payment link with the following data:");
        
        const requestBody = {
            link_id: subscriptionId,
            link_amount: selectedPlan.amount,
            link_currency: "INR",
            link_purpose: selectedPlan.description,
            customer_details: {
                customer_id: customerId,
                customer_name: `${user.firstName} ${user.lastName}`,
                customer_email: user.email,
                customer_phone: "9876543210" // Adding default phone number as required by Cashfree API
            },
            link_meta: {
                plan_type: planType,
                user_id: linkedinId
            },
            link_notify: {
                send_email: true
            },
            link_notes: {
                subscription_type: selectedPlan.planName
            },
            link_auto_reminders: true,
            link_expiry_time: formattedExpiryDate,
            link_partial_payments: false
        };
        
        console.log(JSON.stringify(requestBody, null, 2));

        // Update to use the production API endpoint with explicit credentials
        const response = await fetch("https://api.cashfree.com/pg/links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-version": "2022-09-01",
                "x-client-id": appId,
                "x-client-secret": secretKey,
            },
            body: JSON.stringify(requestBody),
        });
        
        let responseText;
        try {
            responseText = await response.text();
            console.log("API Response Text:", responseText);
            
            // Save response for debugging
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
                        message: "Failed to create payment with Cashfree", 
                        statusCode: response.status,
                        details: data 
                    },
                    { status: response.status }
                );
            }

            // Save subscription details (will be updated to "active" after payment confirmation)
            user.subscription = {
                status: "inactive",
                plan: selectedPlan.planName,
                startDate: startDate,
                endDate: endDate,
                cashFreeSubscriptionId: subscriptionId,
                cashFreeCustomerId: customerId
            };
            
            await user.save();

            return NextResponse.json({
                success: true,
                subscriptionLink: data.link_url,
                subscriptionId: subscriptionId,
                message: "Payment link created. Please complete the payment process."
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
