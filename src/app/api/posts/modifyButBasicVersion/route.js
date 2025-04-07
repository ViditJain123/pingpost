import dbConnect from "@/utils/dbConnect";
import Post from "@/models/postModel";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import userModel from "@/models/userModel";
import OpenAI from "openai";
import { z } from "zod"; 
import { zodResponseFormat } from "openai/helpers/zod";

export async function PUT(request) {
    await dbConnect();
    
    const client = new OpenAI(process.env.OPENAI_API_KEY);
    
    const outputSchema = z.object({
      post: z.string(),
    });

    try{
        const cookiesStore = await cookies();
        const linkedinProfileCookie = cookiesStore.get('linkedin_profile')?.value;
        if (!linkedinProfileCookie) {
            return NextResponse.json(
                { message: 'Authentication required. Please sign in with LinkedIn.' },
                { status: 401 }
            );
        }
        const linkedinProfile = JSON.parse(linkedinProfileCookie);
        const linkedinId = linkedinProfile.linkedinId;

        const { title, content, prompt } = await request.json();
        
        // Get user's LinkedIn specs for style and tone reference
        const user = await userModel.findOne({ linkedinId });
        const linkedinSpecs = user.linkedinSpecs;
        
        const userMessage = "Title: " + title + "/n" + "Prompt: " + prompt + "/n" + "Post Examples: " + linkedinSpecs.postExamples;

        const completion = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "developer",
              content: "You are a LinkedIn post editor. You need to modify an existing post based on the new title and prompt provided by the user. Maintain the user's writing style and tone from their past examples."
            },
            {
              role: "developer",
              content: userMessage
            },
          ],
          response_format: zodResponseFormat(outputSchema, "json"),
        });

        const response = completion.choices[0].message;
        const parsedContent = JSON.parse(response.content);
        
        const updatedPost = parsedContent.post;
        
        // Create a new post or return the updated content
        const post = {
            title: title,
            content: updatedPost,
            prompt: prompt,
            linkedinId: linkedinId
        };

        return NextResponse.json(
            { 
                message: "Post modified successfully",
                post: post
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error modifying post:", error);
        return NextResponse.json(
            { error: "Failed to modify post", details: error.message },
            { status: 500 }
        );
    } 
}