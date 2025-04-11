import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import userModel from "@/models/userModel";

// 1) Import Google Gemini SDK instead of OpenAI
import { GoogleGenAI } from "@google/genai";

// 2) Keep zod for schema validation if desired
import { z } from "zod";

export async function POST(request) {
  await dbConnect();

  // Instantiate the Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY, // Make sure you have this env var set
  });

  // Define your output schema with zod
  const outputSchema = z.object({
    post: z.string(),
    googleSearchQuery: z.string(),
  });

  // Helper to do a Google Image Search
  const googleSearch = async (query) => {
    const api_key = process.env.GOOGLE_API_KEY;
    const search_engine_id = process.env.SEARCH_ENGINE_ID;

    const url =
      `https://www.googleapis.com/customsearch/v1?` +
      `key=${api_key}` +
      `&cx=${search_engine_id}` +
      `&q=${encodeURIComponent(query)}` +
      `&searchType=image`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const items = data.items;
      const imageUrls = items.slice(0, 4).map((item) => item.link);
      return imageUrls;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  try {
    // Check user authentication via LinkedIn cookie
    const cookieStore = await cookies();
    const linkedinProfileCookie = cookieStore.get("linkedin_profile")?.value;

    if (!linkedinProfileCookie) {
      return NextResponse.json(
        { message: "Authentication required. Please sign in with LinkedIn." },
        { status: 401 }
      );
    }

    const linkedinProfile = JSON.parse(linkedinProfileCookie);
    const linkedinId = linkedinProfile.linkedinId;

    // Grab input from request body
    const { title, prompt } = await request.json();

    // Fetch user from DB
    const user = await userModel.findOne({ linkedinId });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const linkedinSpecs = user.linkedinSpecs;

    // Concatenate your instructions + user data in one prompt string
    // (Gemini doesn't need roles the same way OpenAI does, so we'll inline them.)
    const instructionBlock = `
You are a LinkedIn post writing assistant named PingPost. 
Your main goal:
1) Mimic the user's unique writing style from their "post examples."
2) Create a new LinkedIn post using the given title and prompt.
3) The style is personal, uses short paragraphs, real stories, numbers/bullet points, ends with a question, no fluff.

Also produce a concise Google search query ("googleSearchQuery") for an image that fits the post.

User’s Post Examples: ${linkedinSpecs.postExamples}
Title: ${title}
Prompt: ${prompt}

Return STRICT valid JSON with exactly these keys: 
{
  "post": "string", 
  "googleSearchQuery": "string"
}
No extra text or commentary. 
Do NOT enclose your JSON in backticks. 
Avoid any markdown or disclaimers—only the JSON object.
`;

    // Make the Gemini call
    const completion = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: instructionBlock,
      // You can add config if you like:
      // config: { temperature: 0.7, maxOutputTokens: 500 },
    });

    // Gemini returns the text in completion.text
    const rawText = completion.text;

    // Clean up the raw text before parsing - remove Markdown code block syntax
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
      throw new Error(
        "Failed to parse JSON from Gemini. Raw response:\n" + rawText
      );
    }

    // Validate structure with zod
    const validated = outputSchema.parse(parsedContent);
    const { post, googleSearchQuery } = validated;

    // Remove all "**" from the post if needed
    const cleanedPost = post.replace(/\*\*/g, "");

    // Fetch relevant images
    const imageUrls = await googleSearch(googleSearchQuery);

    // Return final response to client
    return NextResponse.json(
      {
        message: "Post generated successfully",
        post: cleanedPost,
        googleSearchQuery,
        images: imageUrls,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Error generating post", error: err.message },
      { status: 500 }
    );
  }
}