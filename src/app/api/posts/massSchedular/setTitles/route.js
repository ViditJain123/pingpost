import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Titles from "@/models/titlesModel";

export async function POST(request) {
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
        
        // Get selected titles from request body
        const { selectedTitles } = await request.json();
        
        if (!selectedTitles || !Array.isArray(selectedTitles)) {
            return NextResponse.json(
                { message: "Invalid request. Selected titles array is required." },
                { status: 400 }
            );
        }
        
        // Update each title's status based on whether it's in the selectedTitles array
        titlesData.titles = titlesData.titles.map(titleObj => {
            const isSelected = selectedTitles.includes(titleObj.title);
            return {
                ...titleObj,
                titleStatus: isSelected ? "selected" : "unselected"
            };
        });
        
        // Save the updated titles
        await titlesData.save();
        
        return NextResponse.json({
            message: "Titles updated successfully",
            titles: titlesData.titles,
            success: true
        }, { status: 200 });
        
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error setting titles", error: error.message },
            { status: 500 }
        );
    }
}