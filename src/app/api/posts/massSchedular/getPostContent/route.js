import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { cookies } from "next/headers";
import Post from '@/models/postModel';

export async function POST(request) {
  try {
    await dbConnect();
    
    // Check LinkedIn authentication
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
    
    // Parse request data
    const { title } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }
    
    // Find the post by title and linkedinId
    const post = await Post.findOne({ title, linkedinId });

    if (!post) {
      
      return NextResponse.json(
        { 
          message: "Post not found",
          content: "", 
        },
        { status: 200 }
      );
    }
    
    // Return the post content - note that in your schema it's called "postContent" not "content"
    const postContent = post.postContent || "";
    return NextResponse.json(
      { 
        message: "Post content retrieved successfully",
        content: postContent 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error fetching post content:", error);
    return NextResponse.json(
      { message: "Failed to fetch post content", error: error.message },
      { status: 500 }
    );
  }
}
