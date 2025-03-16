import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/utils/dbConnect";
import userModel from "@/models/userModel";
import postModel from "@/models/postModel";

// This function will be triggered by Vercel Cron
export async function GET(request) {
  try {
    await dbConnect();
    
    const now = new Date();
    let postsToPublish = [];
    
    // 1. Find posts with specific schedule times that are due
    const postsWithSpecificSchedule = await postModel.find({
      postStatus: "scheduled",
      postSpecificSchedule: true,
      scheduleTime: { $lte: now }
    });
    
    const postsWithoutSpecificSchedule = await postModel.find({
      postStatus: "scheduled",
      postSpecificSchedule: false
    });
    
    // Process the posts without specific schedule
    if (postsWithoutSpecificSchedule.length > 0) {
      // Group posts by user
      const postsByUser = {};
      
      postsWithoutSpecificSchedule.forEach(post => {
        if (!postsByUser[post.linkedinId]) {
          postsByUser[post.linkedinId] = [];
        }
        postsByUser[post.linkedinId].push(post);
      });
      
      // Check each user's fixed schedule time
      for (const linkedinId in postsByUser) {
        const user = await userModel.findOne({ linkedinId });
        
        if (user && user.linkedinSpecs && user.linkedinSpecs.postScheduleFix) {
          // Get user's fixed schedule time
          const fixedTimeStr = user.linkedinSpecs.postScheduleFixTime;
          
          if (fixedTimeStr) {
            const fixedTime = new Date(fixedTimeStr);
            const currentTime = new Date();
            
            // Check if it's time to publish based on the fixed schedule
            // Compare hours and minutes
            if (
              currentTime.getHours() === fixedTime.getHours() &&
              currentTime.getMinutes() === fixedTime.getMinutes()
            ) {
              // Add these posts to the list of posts to publish
              postsToPublish = [...postsToPublish, ...postsByUser[linkedinId]];
            }
          }
        }
      }
    }
    
    // Add posts with specific schedules to the list
    postsToPublish = [...postsToPublish, ...postsWithSpecificSchedule];
    
    console.log(`Found ${postsToPublish.length} posts to publish`);
    
    const results = [];
    
    for (const post of postsToPublish) {
      try {
        // Get the user's LinkedIn access token
        const user = await userModel.findOne({ linkedinId: post.linkedinId });
        
        if (!user || !user.linkedinAccessToken) {
          results.push({
            postId: post._id,
            status: "failed",
            error: "User not found or missing access token"
          });
          continue;
        }
        
        // Prepare post data
        let postData;
        const content = post.postContent;
        let mediaAssets = [];
        
        // Process image URLs if present
        if (post.imageUrls && post.imageUrls.length > 0) {
          for (const imageUrl of post.imageUrls) {
            try {
              // Download the image from URL
              const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer'
              });
              
              // Initialize upload to LinkedIn
              const registerUploadResponse = await axios.post(
                'https://api.linkedin.com/v2/assets?action=registerUpload',
                {
                  registerUploadRequest: {
                    recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                    owner: `urn:li:person:${user.linkedinId}`,
                    serviceRelationships: [{
                      relationshipType: "OWNER",
                      identifier: "urn:li:userGeneratedContent"
                    }]
                  }
                },
                {
                  headers: {
                    'Authorization': `Bearer ${user.linkedinAccessToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              const uploadUrl = registerUploadResponse.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
              const assetId = registerUploadResponse.data.value.asset;
              
              // Upload the image to LinkedIn
              await axios.put(uploadUrl, imageResponse.data, {
                headers: {
                  'Authorization': `Bearer ${user.linkedinAccessToken}`,
                  'Content-Type': imageResponse.headers['content-type']
                }
              });
              
              mediaAssets.push(assetId);
            } catch (imageError) {
              console.error("Error uploading image URL:", imageError);
            }
          }
        }
        
        // Prepare post data based on whether we have media to include
        if (mediaAssets.length > 0) {
          // Post with images
          postData = {
            author: `urn:li:person:${user.linkedinId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: content
                },
                shareMediaCategory: "IMAGE",
                media: mediaAssets.map(mediaId => ({
                  status: "READY",
                  description: {
                    text: post.title || "Shared image"
                  },
                  media: mediaId
                }))
              }
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
          };
        } else {
          // Text-only post
          postData = {
            author: `urn:li:person:${user.linkedinId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: {
                  text: content
                },
                shareMediaCategory: "NONE"
              }
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
          };
        }
        
        // Publish the post to LinkedIn
        const linkedInResponse = await axios.post(
          'https://api.linkedin.com/v2/ugcPosts',
          postData,
          {
            headers: {
              'Authorization': `Bearer ${user.linkedinAccessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update post status to published
        post.postStatus = "published";
        post.timePublished = new Date();
        await post.save();
        
        console.log(`Successfully published post ${post._id} to LinkedIn (ID: ${linkedInResponse.data.id})`);
        
        // Add to user's post history
        user.posts = user.posts || [];
        user.posts.push({
          content,
          platform: "LinkedIn",
          postId: linkedInResponse.data.id,
          createdAt: new Date(),
          hasMedia: mediaAssets.length > 0
        });
        await user.save();
        
        results.push({
          postId: post._id,
          linkedinPostId: linkedInResponse.data.id,
          status: "published"
        });
        
      } catch (postError) {
        console.error(`Error publishing post ${post._id}:`, postError);
        
        // Optionally update post status to failed
        try {
          post.postStatus = "failed";  // You may want to add this status to your enum
          post.timeUpdated = new Date();
          await post.save();
          console.log(`Updated post ${post._id} status to failed`);
        } catch (updateError) {
          console.error(`Failed to update post status for ${post._id}:`, updateError);
        }
        
        results.push({
          postId: post._id,
          status: "failed",
          error: postError.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${postsToPublish.length} scheduled posts`,
      results
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json({
      error: "Failed to process scheduled posts",
      message: error.message
    }, { status: 500 });
  }
}
