import Post from "@/models/postModel";
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
        
        const postData = await request.json();
        const { title, postContent, images } = postData;
        
        const post = new Post({
            linkedinId,
            title,
            postContent,
            images
        });

        await post.save();
        
        return NextResponse.json(
            { message: "Post saved successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in createPost:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}