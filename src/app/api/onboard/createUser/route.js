import userModel from "@/models/userModel";
import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
    await dbConnect();
    try {
        const cookieStore = await cookies();
        const linkedinProfileCookie = await cookieStore.get('linkedin_profile')?.value;
        
        if (!linkedinProfileCookie) {
            return NextResponse.json(
                { message: "Authentication required. Please sign in with LinkedIn." },
                { status: 401 }
            );
        }
        
        const linkedinProfile = JSON.parse(linkedinProfileCookie);
        const linkedinId = linkedinProfile.linkedinId;
        
        const userData = await request.json();
        const { audience, niche, narrative, postExamples } = userData;

        const linkedinSpecs = {
            audience,
            niche,
            narrative,
            postExamples
        }

        const user = await userModel.findOne({ linkedinId });
        
        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        if (user.linkedinSpecs) {
            return NextResponse.json(
                { message: "User data already exists" },
                { status: 400 }
            );
        }

        user.linkedinSpecs = linkedinSpecs;
        await user.save();
        
        return NextResponse.json(
            { message: "User data saved successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in createUser:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}