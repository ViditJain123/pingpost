import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import dbConnect from "@/utils/dbConnect";
import userModel from "@/models/userModel";
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    try {
        await dbConnect();
        
        const cookieStore = await cookies();
        const userData = cookieStore.get("linkedin_profile")?.value;
        
        if (!userData) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }
        
        const userInfo = JSON.parse(userData);
        
        // Handle multipart form data
        const formData = await request.formData();
        const content = formData.get('content');
        const title = formData.get('title');
        const visibility = formData.get('visibility') || 'PUBLIC';
        
        // Get images from form data
        const images = formData.getAll('images');
        const imageUrls = formData.getAll('imageUrls');
        
        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }
        
        const user = await userModel.findOne({ linkedinId: userInfo.linkedinId });
        
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        if (!user.linkedinAccessToken) {
            return NextResponse.json({ error: "LinkedIn access token not found" }, { status: 400 });
        }
        
        // Process and upload images if present
        let mediaAssets = [];
        
        // Handle uploaded image files
        if (images && images.length > 0) {
            for (const image of images) {
                try {
                    const bytes = await image.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    
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
                    await axios.put(uploadUrl, buffer, {
                        headers: {
                            'Authorization': `Bearer ${user.linkedinAccessToken}`,
                            'Content-Type': image.type
                        }
                    });
                    
                    mediaAssets.push(assetId);
                } catch (imageError) {
                    console.error("Error uploading image:", imageError);
                }
            }
        }
        
        // Handle image URLs if present
        if (imageUrls && imageUrls.length > 0) {
            for (const imageUrl of imageUrls) {
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
        let postData;
        
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
                                text: title || "Shared image"
                            },
                            media: mediaId
                        }))
                    }
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": visibility
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
                    "com.linkedin.ugc.MemberNetworkVisibility": visibility
                }
            };
        }
        
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
        
        if (formData.get('saveToHistory') !== 'false') {
            user.posts = user.posts || [];
            user.posts.push({
                content,
                platform: "LinkedIn",
                postId: linkedInResponse.data.id,
                createdAt: new Date(),
                hasMedia: mediaAssets.length > 0
            });
            await user.save();
        }
        
        return NextResponse.json({
            success: true,
            message: "Post published successfully",
            postId: linkedInResponse.data.id
        });
        
    } catch (error) {
        console.error("Error publishing post:", error);
        
        // Handle LinkedIn API specific errors
        if (error.response && error.response.data) {
            return NextResponse.json({
                error: "LinkedIn API error",
                details: error.response.data
            }, { status: error.response.status || 500 });
        }
        
        return NextResponse.json({
            error: "Failed to publish post",
            message: error.message
        }, { status: 500 });
    }
}
