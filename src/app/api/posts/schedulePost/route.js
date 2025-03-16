import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/utils/dbConnect";
import userModel from "@/models/userModel";
import postModel from "@/models/postModel";

export async function POST(request) {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const userData = cookieStore.get("linkedin_profile")?.value;
    
    if (!userData) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    
    const userInfo = JSON.parse(userData);
    
    let requestData;
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      requestData = await request.json();
    } else {
      const formData = await request.formData();
      requestData = {
        content: formData.get('content'),
        title: formData.get('title'),
        scheduleTime: formData.get('scheduleTime'),
        visibility: formData.get('visibility') || 'PUBLIC',
        images: formData.getAll('images'),
        imageUrls: formData.getAll('imageUrls'),
        postId: formData.get('postId'),
        postSpecificSchedule: formData.get('postSpecificSchedule') === 'true',
      };
    }

    
    
    const { content, title, scheduleTime, visibility, images = [], imageUrls = [], postId, postSpecificSchedule } = requestData;
    
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    if (!scheduleTime) {
      return NextResponse.json({ error: "Schedule time is required" }, { status: 400 });
    }
    
    // Extract only the date part from scheduleTime
    const scheduleDateOnly = new Date(scheduleTime);
    scheduleDateOnly.setHours(0, 0, 0, 0);
    
    if (isNaN(scheduleDateOnly.getTime())) {
      return NextResponse.json({ error: "Invalid schedule time format" }, { status: 400 });
    }
    
    // Check if schedule date is in the future
    if (scheduleDateOnly < new Date().setHours(0, 0, 0, 0)) {
      return NextResponse.json({ error: "Schedule date must be in the future" }, { status: 400 });
    }
    
    const user = await userModel.findOne({ linkedinId: userInfo.linkedinId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Find or initialize the target post to determine if it has post-specific scheduling
    let targetPost = null;
    if (postId) {
      targetPost = await postModel.findById(postId);
    }
    
    // Determine the final schedule time based on preferences
    let finalScheduleTime;
    let isPostSpecificSchedule = targetPost?.postSpecificSchedule || postSpecificSchedule || false;

    if (isPostSpecificSchedule) {
      // Use the full date and time from scheduleTime
      finalScheduleTime = new Date(scheduleTime);
    } else if (user.linkedinSpecs?.postScheduleFix) {
      // Use the date from scheduleTime but time from user's fixed schedule time
      if (!user.linkedinSpecs.postScheduleFixTime) {
        return NextResponse.json({ 
          error: "No fixed posting time found in your profile",
          message: "Please go to your profile and set a fixed posting time"
        }, { status: 400 });
      }
      
      const [hours, minutes] = user.linkedinSpecs.postScheduleFixTime.split(':').map(Number);
      finalScheduleTime = new Date(scheduleDateOnly);
      finalScheduleTime.setHours(hours, minutes, 0, 0);
    } else {
      return NextResponse.json({ 
        error: "No posting time configuration found",
        message: "Please either enable post-specific scheduling or set a fixed posting time in your profile"
      }, { status: 400 });
    }
    
    // Check if the final schedule time is valid and in the future
    if (isNaN(finalScheduleTime.getTime())) {
      return NextResponse.json({ error: "Could not determine a valid schedule time" }, { status: 400 });
    }
    
    if (finalScheduleTime <= new Date()) {
      return NextResponse.json({ error: "Calculated schedule time must be in the future" }, { status: 400 });
    }

    // Let's find if there's an existing post to update
    if (targetPost) {
      // Update existing post
      targetPost.title = title || targetPost.title;
      targetPost.postContent = content;
      targetPost.postStatus = "scheduled";
      targetPost.postSpecificSchedule = isPostSpecificSchedule;
      targetPost.scheduleTime = finalScheduleTime;
      targetPost.timeUpdated = new Date();
      
      // Update images if provided
      if (images.length > 0) {
        targetPost.images = Array.from(images).map(image => image.name);
      }
      
      if (imageUrls.length > 0) {
        targetPost.imageUrls = Array.from(imageUrls);
      }
      
      await targetPost.save();
      
      console.log(`Post updated and scheduled successfully: Post ID ${targetPost._id}, Schedule Time: ${finalScheduleTime}`);
      
      return NextResponse.json({
        success: true,
        message: "Post updated and scheduled successfully",
        postId: targetPost._id,
        scheduleTime: finalScheduleTime
      });
    } else {
      // Create a new post document
      const newPost = new postModel({
        linkedinId: userInfo.linkedinId,
        title: title || "Scheduled Post",
        postContent: content,
        images: images.length > 0 ? Array.from(images).map(image => image.name) : [],
        imageUrls: imageUrls.length > 0 ? Array.from(imageUrls) : [],
        postStatus: "scheduled",
        postSpecificSchedule: isPostSpecificSchedule,
        scheduleTime: finalScheduleTime,
        timeCreated: new Date(),
        timeUpdated: new Date()
      });
      
      // Save the post
      await newPost.save();
      
      console.log(`New post scheduled successfully: Post ID ${newPost._id}, Schedule Time: ${finalScheduleTime}`);
      
      return NextResponse.json({
        success: true,
        message: "Post scheduled successfully",
        postId: newPost._id,
        scheduleTime: finalScheduleTime
      });
    }
  } catch (error) {
    console.error("Error scheduling post:", error);
    
    return NextResponse.json({
      error: "Failed to schedule post",
      message: error.message
    }, { status: 500 });
  }
}
