import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Titles from "@/models/titlesModel";
import { cookies } from "next/headers";

export async function GET() {
    try {
        // Connect to the database
        await dbConnect();
        
        // Get LinkedIn profile from cookies
        const cookieStore = await cookies();
        const linkedinProfileCookie = cookieStore.get('linkedin_profile')?.value;
        
        if (!linkedinProfileCookie) {
            return NextResponse.json(
                { success: false, message: "Authentication required. Please sign in with LinkedIn." },
                { status: 401 }
            );
        }

        const linkedinProfile = JSON.parse(linkedinProfileCookie);
        const linkedinId = linkedinProfile.linkedinId;
        
        // Check for in-game or in-process titles for this specific user
        const activeTitles = await Titles.findOne({ 
            linkedinId,
            status: { $in: ["ingame", "inprocess"] }
        });
        
        if (activeTitles) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false });
        }
    } catch (error) { // Fixed the typo here (removed the "s")
        console.error("Error checking title status:", error);
        return NextResponse.json(
            { success: false, error: "Failed to check title status" },
            { status: 500 }
        );
    }
}
