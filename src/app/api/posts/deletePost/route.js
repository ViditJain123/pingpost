import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Post from "@/models/postModel";
import { cookies } from 'next/headers';

export async function DELETE(request) {
  try {
    await dbConnect();
    
    // LinkedIn authentication check
    const cookieStore = await cookies();
    const linkedinProfileCookie = cookieStore.get('linkedin_profile')?.value;

    if (!linkedinProfileCookie) {
      return NextResponse.json(
        { message: 'Authentication required. Please sign in with LinkedIn.' },
        { status: 401 }
      );
    }

    const linkedinProfile = JSON.parse(linkedinProfileCookie);
    const linkedinId = linkedinProfile.linkedinId;
    
    // Extract postId from the URL using the searchParams
    const url = new URL(request.url);
    const postId = url.searchParams.get("id");
    
    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Find post by ID
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    // Verify that the post belongs to the authenticated user
    if (post.linkedinId !== linkedinId) {
      return NextResponse.json(
        { error: "Unauthorized: You don't have permission to delete this post" },
        { status: 403 }
      );
    }
    
    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    return NextResponse.json({ 
      message: "Post deleted successfully" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
