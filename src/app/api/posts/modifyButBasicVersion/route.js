import dbConnect from "@/utils/dbConnect";
import Post from "@/models/postModel";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import userModel from "@/models/userModel";
// Replace OpenAI with Google Gemini
import { GoogleGenAI } from "@google/genai";
import { z } from "zod"; 
// Remove zodResponseFormat import as Gemini handles responses differently

export async function PUT(request) {
    await dbConnect();
    
    // Initialize Gemini client instead of OpenAI
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY, // Make sure this env var is set
    });
    
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

        console.log("Received request to modify post:", { title, content, prompt });
        
        // Construct the prompt for Gemini (consolidated into a single string)
        const instructionPrompt = `
You are a LinkedIn post editor. You need to modify an existing post based on the prompt provided by the user. Maintain the user's writing style and tone from the given post.

existingPost: ${content}
Prompt: ${prompt}

Return STRICT valid JSON with exactly these keys:
{
  "post": "string"
}
No extra text or commentary.
Do NOT enclose your JSON in backticks.
Avoid any markdown or disclaimers—only the JSON object.
`;

        // Make the Gemini API call
        const completion = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: instructionPrompt,
        });

        // Get raw text response
        const rawText = completion.text;
        
        // Clean up the raw text before parsing - remove Markdown code block syntax if present
        let cleanText = rawText;
        
        // Check if the response is wrapped in code blocks and remove them
        if (cleanText.startsWith('```')) {
            // Remove opening ``` and potential "json" label
            cleanText = cleanText.replace(/^```(?:json)?\s*/, '');
            
            // Remove closing ```
            cleanText = cleanText.replace(/\s*```$/, '');
        }
        
        // Parse the cleaned text
        let parsedContent;
        try {
            parsedContent = JSON.parse(cleanText);
        } catch (parseErr) {
            throw new Error("Failed to parse JSON from Gemini. Raw response:\n" + rawText);
        }
        
        // Validate structure with zod
        const validated = outputSchema.parse(parsedContent);
        const updatedPost = validated.post;
        
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