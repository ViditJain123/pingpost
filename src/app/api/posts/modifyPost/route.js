import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Post from "@/models/postModel";
import { cookies } from 'next/headers';

export async function PUT(request) {
  try {
    await dbConnect();
    
    const cookieStore = cookies();
    const linkedinProfileCookie = cookieStore.get('linkedin_profile')?.value;

    if (!linkedinProfileCookie) {
      return NextResponse.json(
        { message: 'Authentication required. Please sign in with LinkedIn.' },
        { status: 401 }
      );
    }

    const linkedinProfile = JSON.parse(linkedinProfileCookie);
    const linkedinId = linkedinProfile.linkedinId;
    
    const url = new URL(request.url);
    const postId = url.searchParams.get("id");
    
    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Find post by ID first to verify ownership
    const existingPost = await Post.findById(postId);
    
    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    // Verify that the post belongs to the authenticated user
    if (existingPost.linkedinId !== linkedinId) {
      return NextResponse.json(
        { error: "Unauthorized: You don't have permission to modify this post" },
        { status: 403 }
      );
    }

    // Parse request body to get updated fields
    const { title, postContent } = await request.json();
    
    if (!title && !postContent) {
      return NextResponse.json(
        { error: "At least one field (title or postContent) is required for update" },
        { status: 400 }
      );
    }
    
    // Update fields and set timeUpdated
    const updateData = {
      ...(title && { title }),
      ...(postContent && { postContent }),
      timeUpdated: new Date()
    };
    
    // Find and update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateData,
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({ 
      message: "Post updated successfully", 
      post: updatedPost 
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
