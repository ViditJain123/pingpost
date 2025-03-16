import Post from '@/models/postModel';
import dbConnect from '@/utils/dbConnect';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import cloudinary from '@/lib/cloudinaryConnect';

export async function POST(request) {
    await dbConnect();

    try {
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

        const postData = await request.formData();

        const title = postData.get('title');
        const postContent = postData.get('postContent');
        const imageUrls = postData.getAll('imageUrls');
        const files = postData.getAll('images');

        if (!title || !postContent) {
            return NextResponse.json(
                { message: 'Title and post content are required.' },
                { status: 400 }
            );
        }

        let uploadedImages = [];

        // Verify Cloudinary configuration before trying to upload
        const { cloud_name, api_key, api_secret } = cloudinary.config();
        if (!cloud_name || cloud_name === 'your-cloud-name' || !api_key || !api_secret) {
            console.warn('Cloudinary is not properly configured. Skipping image upload.');
        } 
        else if (files.length > 0) {
            try {
                const uploadPromises = files.map(async (file) => {
                    // Skip if file is not an actual file (e.g., it's a string or other non-file data)
                    if (!(file instanceof File) || !file.type.startsWith('image/')) {
                        console.log('Skipping non-image file:', file.name || 'unknown');
                        return null;
                    }
                    
                    // Only proceed with valid image files
                    try {
                        const bytes = await file.arrayBuffer();
                        const buffer = Buffer.from(bytes);

                        return new Promise((resolve, reject) => {
                            cloudinary.uploader
                                .upload_stream(
                                    { 
                                        folder: 'user-post-images',
                                        resource_type: 'image' 
                                    },
                                    (error, result) => {
                                        if (error) {
                                            console.error('Cloudinary upload error for file:', file.name, error);
                                            return reject(error);
                                        }
                                        resolve(result.secure_url);
                                    }
                                )
                                .end(buffer);
                        });
                    } catch (fileError) {
                        console.error('Error processing file:', file.name, fileError);
                        return null;
                    }
                });

                // Filter out null results from failed uploads
                const uploadResults = await Promise.all(uploadPromises);
                uploadedImages = uploadResults.filter(url => url !== null);
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                // Continue with post creation even if image upload fails
            }
        }

        // Combine uploaded image URLs with provided image URLs
        const allImageUrls = [...uploadedImages, ...imageUrls].filter(Boolean);

        const post = new Post({
            linkedinId,
            title,
            postContent,
            images: allImageUrls, // Store all images in a single array
            postStatus: 'draft',
            postSpecificSchedule: false,
            scheduleTime: null,
        });

        await post.save();

        return NextResponse.json(
            { message: 'Post created successfully', post },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error in createPost:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}