import dbConnect from "@/utils/dbConnect";
import Post from "@/models/postModel";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
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

        // Find all posts associated with the user's LinkedIn ID
        const posts = await Post.find({ linkedinId }).sort({ timeCreated: -1 });

        return NextResponse.json({
            success: true,
            posts
        }, { status: 200 });

    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { success: false, message: "Failed to fetch posts", error: err.message },
            { status: 500 }
        );
    }
}