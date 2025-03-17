import dbConnect from "@/utils/dbConnect";
import Post from "@/models/postModel";
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

        // Parse request body
        const body = await request.json();
        const { postId } = body;

        if (!postId) {
            return NextResponse.json(
                { success: false, message: "Post ID is required" },
                { status: 400 }
            );
        }

        // Find the post and verify ownership
        const post = await Post.findById(postId);

        if (!post) {
            return NextResponse.json(
                { success: false, message: "Post not found" },
                { status: 404 }
            );
        }

        if (post.linkedinId !== linkedinId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized. You don't own this post." },
                { status: 403 }
            );
        }

        // Verify post is in scheduled status
        if (post.postStatus !== 'scheduled') {
            return NextResponse.json(
                { success: false, message: "Only scheduled posts can be cancelled" },
                { status: 400 }
            );
        }

        // Update post status to draft
        post.postStatus = 'draft';
        post.postSpecificSchedule = false;
        post.scheduleTime = null;
        post.timeUpdated = new Date();

        await post.save();

        return NextResponse.json({
            success: true,
            message: "Post schedule cancelled successfully",
            postId: post._id,
        }, { status: 200 });

    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { success: false, message: "Failed to cancel scheduled post", error: err.message },
            { status: 500 }
        );
    }
}
