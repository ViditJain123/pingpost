import userModel from "@/models/userModel";
import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request) {
    await dbConnect();
    try {
        const cookieStore = await cookies();
        const linkedinProfileCookie = await cookieStore.get('linkedin_profile')?.value;
        
        if (!linkedinProfileCookie) {
            return NextResponse.json({
                status: 401,
                body: {
                    message: "Authentication required. Please sign in with LinkedIn."
                }
            });
        }
        
        const linkedinProfile = JSON.parse(linkedinProfileCookie);
        const linkedinId = linkedinProfile.linkedinId;
        
        const user = await userModel.findOne({ linkedinId });
        
        if (!user.linkedinSpecs) {
            return NextResponse.json({
                status: 404,
                body: {
                    message: "User not found",
                }
            });
        } else {
            return NextResponse.json({
                status: 200,
                body: user
            });
        }
    } catch (error) {
        return NextResponse.json({
            status: 500,
            body: {
                message: error.message
            }
        });
    }
}