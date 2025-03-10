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
                    const bytes = await file.arrayBuffer();
                    const buffer = Buffer.from(bytes);

                    return new Promise((resolve, reject) => {
                        cloudinary.uploader
                            .upload_stream(
                                { folder: 'user-post-images' },
                                (error, result) => {
                                    if (error) return reject(error);
                                    resolve(result.secure_url);
                                }
                            )
                            .end(buffer);
                    });
                });

                uploadedImages = await Promise.all(uploadPromises);
            } catch (cloudinaryError) {
                console.error('Cloudinary upload error:', cloudinaryError);
                // Continue with post creation even if image upload fails
            }
        }

        const post = new Post({
            linkedinId,
            title,
            postContent,
            images: uploadedImages,
            postStatus: 'draft', // Adding the status field back
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