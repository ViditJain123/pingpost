import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Titles from "@/models/titlesModel";

export async function GET() {
    try {
        // Connect to the database
        await dbConnect();
        const inGameTitles = await Titles.findOne({ status: "ingame" });
        if (inGameTitles) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false });
        }
    } catch (error) {
        console.error("Error checking title status:", error);
        return NextResponse.json(
            { success: false, error: "Failed to check title status" },
            { status: 500 }
        );
    }
}
