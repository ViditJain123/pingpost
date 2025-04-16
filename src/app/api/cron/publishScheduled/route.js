import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/utils/dbConnect";
import userModel from "@/models/userModel";
import postModel from "@/models/postModel";

// This function can be triggered by GitHub Actions or Vercel Cron
export async function GET(request) {
  try {
    await dbConnect();
    
    const now = new Date();
    console.log(`Current server time: ${now.toISOString()}`);
    console.log(`Current server timezone: UTC${-now.getTimezoneOffset()/60} (offset: ${now.getTimezoneOffset()} minutes)`);
    let postsToPublish = [];
    
    // Debug: Check how many scheduled posts exist in total
    const allScheduledPosts = await postModel.find({
      postStatus: "scheduled"
    });
    console.log(`Total scheduled posts in database: ${allScheduledPosts.length}`);
    
    // Debug: Check specific schedule posts
    const specificSchedulePosts = await postModel.find({
      postStatus: "scheduled",
      postSpecificSchedule: true
    });
    console.log(`Posts with specific schedule: ${specificSchedulePosts.length}`);
    
    // Enhanced debugging for all specific schedule posts
    if (specificSchedulePosts.length > 0) {
      console.log("All scheduled posts with times:");
      specificSchedulePosts.forEach(post => {
        console.log({
          id: post._id,
          scheduleTime: post.scheduleTime,
          currentTime: now,
          isScheduleTimePast: post.scheduleTime <= now,
          timeUntilPublish: post.scheduleTime ? (post.scheduleTime - now) / 1000 + ' seconds' : 'N/A',
          postSpecificSchedule: post.postSpecificSchedule,
          isReadyByMethod: post.isReadyToPublish()
        });
      });
    }
    
    // Improved query for posts with specific schedules that are ready to publish
    let postsWithSpecificSchedule = await postModel.find({
      postStatus: "scheduled",
      postSpecificSchedule: true,
      scheduleTime: { $lte: now }
    }).lean();
    
    // Double-check with the model's method as a fallback
    if (postsWithSpecificSchedule.length === 0) {
      console.log("No posts found using MongoDB query, trying manual checking...");
      const allSpecificSchedulePosts = await postModel.find({
        postStatus: "scheduled",
        postSpecificSchedule: true
      });
      
      postsWithSpecificSchedule = allSpecificSchedulePosts.filter(post => post.isReadyToPublish());
      
      console.log(`Manual check found ${postsWithSpecificSchedule.length} posts ready to publish`);
    }
    
    console.log(`Posts with specific schedule ready to publish: ${postsWithSpecificSchedule.length}`);
    
    // Add all posts with specific schedules in the past to the list
    postsToPublish = [...postsToPublish, ...postsWithSpecificSchedule];
    
    // 2. Process posts without specific schedule times (based on fixed schedule)
    const postsWithoutSpecificSchedule = await postModel.find({
      postStatus: "scheduled",
      postSpecificSchedule: false
    });
    
    // Define postsByUser outside the conditional block so it's accessible later
    const postsByUser = {};
  
    if (postsWithoutSpecificSchedule.length > 0) {
      // Group posts by user
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
            // Improved handling of time string formats
            let fixedTime;
            
            // Check if the time is just "HH:MM" format
            if (/^\d{1,2}:\d{2}$/.test(fixedTimeStr)) {
              const [hours, minutes] = fixedTimeStr.split(':').map(Number);
              
              // Create today's date in UTC
              fixedTime = new Date();
              
              // Log time zone information for debugging
              console.log(`Server timezone offset: ${fixedTime.getTimezoneOffset()} minutes`);
              
              // Set hours and minutes - interpret the time as if in the same timezone as the server
              fixedTime.setHours(hours, minutes, 0, 0);
              
              console.log(`Fixed time interpreted as: ${fixedTime.toISOString()}`);
            } else {
              // Try standard date parsing
              fixedTime = new Date(fixedTimeStr);
            }
            
            const currentTime = new Date();
            
            // For debugging
            console.log(`Current time (ISO): ${currentTime.toISOString()}`);
            console.log(`Fixed time (ISO): ${fixedTime.toISOString()}`);
            console.log(`Current > Fixed: ${currentTime > fixedTime}`);
            
            // Check if it's time to publish based on the fixed schedule
            // Compare hours and minutes
            if (
              // Check if current time is past the scheduled time
              currentTime >= fixedTime
            ) {
              console.log(`Time to publish! Current: ${currentTime.toISOString()}, Fixed: ${fixedTime.toISOString()}`);
              // Add these posts to the list of posts to publish
              postsToPublish = [...postsToPublish, ...postsByUser[linkedinId]];
            }
          }
        }
      }
    }
    
    console.log(`Found ${postsToPublish.length} posts to publish`);
    
    // Extra debug logging for fixed schedule posts
    if (postsWithoutSpecificSchedule.length > 0) {
      console.log(`Posts with fixed schedule: ${postsWithoutSpecificSchedule.length}`);
      
      // Now postsByUser will be accessible here
      for (const linkedinId in postsByUser) {
        const user = await userModel.findOne({ linkedinId });
        if (user && user.linkedinSpecs && user.linkedinSpecs.postScheduleFix) {
          const fixedTimeStr = user.linkedinSpecs.postScheduleFixTime;
          if (fixedTimeStr) {
            // Improved handling of time string formats (same logic as above)
            let fixedTime;
            
            // Log the raw time string for debugging
            console.log(`User ${linkedinId} raw fixed time string: ${fixedTimeStr}`);
            
            // Check if the time is just "HH:MM" format
            if (/^\d{1,2}:\d{2}$/.test(fixedTimeStr)) {
              const [hours, minutes] = fixedTimeStr.split(':').map(Number);
              fixedTime = new Date();
              fixedTime.setHours(hours, minutes, 0, 0);
            } else {
              // Try standard date parsing
              fixedTime = new Date(fixedTimeStr);
            }
            
            console.log(`Current hours:minutes: ${now.getHours()}:${now.getMinutes()}`);
            console.log(`Fixed time hours:minutes: ${fixedTime.getHours()}:${fixedTime.getMinutes()}`);
            console.log(`Fixed time valid: ${!isNaN(fixedTime.getTime())}`);
          }
        }
      }
    }
    
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
          
          // Update post status to failed
          post.postStatus = "failed";
          post.timeUpdated = new Date();
          await post.save();
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
        post.timeUpdated = new Date();
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
        
        // Update post status to failed
        try {
          post.postStatus = "failed";
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