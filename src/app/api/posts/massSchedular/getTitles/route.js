import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Titles from "@/models/titlesModel";

export async function GET(request) {
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

        const titlesData = await Titles.findOne({ 
            linkedinId, 
            status: "ingame" 
        });

        if (!titlesData) {
            return NextResponse.json(
                { message: "No titles found for this user.", titles: [] },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { 
                message: "Titles retrieved successfully", 
                titles: titlesData.titles 
            },
            { status: 200 }
        );
    }
    catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error retrieving titles", error: error.message },
            { status: 500 }
        );
    }
}