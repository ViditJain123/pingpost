import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import { cookies } from "next/headers";
import Titles from '@/models/titlesModel';

export async function POST(request) {
  try {
    await dbConnect();
    
    // Check authentication
    const cookieStore = await cookies();
    const linkedinProfileCookie = cookieStore.get('linkedin_profile')?.value;
    if (!linkedinProfileCookie) {
      return NextResponse.json(
        { message: "Authentication required. Please sign in with LinkedIn." },
        { status: 401 }
      );
    }
    
    // Extract linkedinId from the cookie
    const linkedinProfile = JSON.parse(linkedinProfileCookie);
    const linkedinId = linkedinProfile.id;
    
    // Parse request data
    const { title, titleStatus } = await request.json();
    
    if (!title || !titleStatus) {
      return NextResponse.json(
        { message: "Title and status are required" },
        { status: 400 }
      );
    }
    
    // Update title status in Titles collection
    const result = await Titles.updateOne(
      { 
        linkedinId,
        "titles.title": title
      },
      {
        $set: { "titles.$.titleStatus": titleStatus }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Title not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        message: "Title status updated successfully",
        status: titleStatus
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error updating title status:", error);
    return NextResponse.json(
      { message: "Failed to update title status", error: error.message },
      { status: 500 }
    );
  }
}
