import dbConnect from "@/utils/dbConnect";
import User from "@/models/userModel";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    await dbConnect();

    try {
        const cookieStore = await cookies();
        const linkedinProfileCookie = await cookieStore.get('linkedin_profile')?.value;

        if (!linkedinProfileCookie) {
            return NextResponse.json(
                { message: "Authentication required. Please sign in with LinkedIn.", hasActiveSubscription: false },
                { status: 401 }
            );
        }

        const linkedinProfile = JSON.parse(linkedinProfileCookie);
        const linkedinId = linkedinProfile.linkedinId;

        // Find the user associated with the LinkedIn ID
        const user = await User.findOne({ linkedinId });

        if (!user) {
            return NextResponse.json(
                { message: "User not found", hasActiveSubscription: false },
                { status: 404 }
            );
        }

        // Check if user has an active subscription
        const hasActiveSubscription = 
            user.subscription && 
            user.subscription.status === "active" && 
            new Date(user.subscription.endDate) > new Date();
        
        return NextResponse.json({
            success: true,
            hasActiveSubscription,
            subscription: user.subscription || null
        }, { status: 200 });

    } catch (error) {
        console.error("Error checking subscription status:", error);
        return NextResponse.json(
            { success: false, message: "Failed to check subscription status", error: error.message, hasActiveSubscription: false },
            { status: 500 }
        );
    }
}
