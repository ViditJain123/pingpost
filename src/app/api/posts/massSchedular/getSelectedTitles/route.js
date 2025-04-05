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
        
        console.log("Looking for selected titles for user:", linkedinId);
        
        // Look for any status since we might have issues with status transitions
        const titlesData = await Titles.findOne({ linkedinId });
        
        if (!titlesData) {
            console.log("No titles document found at all");
            return NextResponse.json(
                { message: "No titles found for this user.", titles: [] },
                { status: 200 }
            );
        }
        
        console.log("Found titles document with status:", titlesData.status);
        
        const selectedTitles = titlesData.titles.filter(title => title.titleStatus === "selected");
        console.log("Number of selected titles found:", selectedTitles.length);
        
        if (selectedTitles.length === 0) {
            return NextResponse.json(
                { message: "No selected titles found for this user.", titles: [] },
                { status: 200 }
            );
        }
        
        return NextResponse.json(
            { 
                message: "Selected titles retrieved successfully", 
                titles: selectedTitles 
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error retrieving selected titles:", error);
        return NextResponse.json(
            { message: "Error retrieving titles", error: error.message },
            { status: 500 }
        );
    }
}