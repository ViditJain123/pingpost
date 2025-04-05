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
                { message: "Authentication required. Please sign in with LinkedIn.", success: false },
                { status: 401 }
            );
        }

        const linkedinProfile = JSON.parse(linkedinProfileCookie);
        const linkedinId = linkedinProfile.linkedinId;
        
        console.log("Processing selection for LinkedIn ID:", linkedinId);

        // Get selected titles from request body
        const { selectedTitles } = await request.json();
        console.log("Received selected titles:", selectedTitles);
        
        if (!selectedTitles || !Array.isArray(selectedTitles)) {
            return NextResponse.json(
                { message: "Invalid request. Selected titles array is required.", success: false },
                { status: 400 }
            );
        }
        
        // First, find the document without status filter to check if it exists at all
        let titlesData = await Titles.findOne({ linkedinId });
        console.log("Found document status:", titlesData?.status);

        if (!titlesData) {
            return NextResponse.json(
                { message: "No titles found for this user.", titles: [], success: false },
                { status: 200 }
            );
        }

        // More direct update using MongoDB's $set operator
        const updateResult = await Titles.findOneAndUpdate(
            { linkedinId },
            { 
                $set: {
                    status: "inprocess",
                    titles: titlesData.titles.map(titleObj => ({
                        ...titleObj.toObject(),
                        titleStatus: selectedTitles.includes(titleObj.title) ? "selected" : "unselected"
                    }))
                }
            },
            { new: true }
        );

        console.log("Update successful:", !!updateResult);
        console.log("Selected titles count after update:", 
            updateResult?.titles.filter(t => t.titleStatus === "selected").length || 0);
        
        return NextResponse.json({
            message: "Titles updated successfully",
            titles: updateResult.titles,
            success: true
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error setting titles:", error);
        return NextResponse.json(
            { message: "Error setting titles", error: error.message, success: false },
            { status: 500 }
        );
    }
}