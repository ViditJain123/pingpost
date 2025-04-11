import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import userModel from "@/models/userModel";

// Import Google Gemini SDK instead of OpenAI
import { GoogleGenAI } from "@google/genai";

import { z } from "zod";
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  await dbConnect();

  // Instantiate the Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY, // Make sure you have this env var set
  });

  const outputSchema = z.object({
    post: z.string(),
    googleSearchQuery: z.string()
  });

  const googleSearch = async (query) => {
    const api_key = process.env.GOOGLE_API_KEY;
    const search_engine_id = process.env.SEARCH_ENGINE_ID;

    // Validate environment variables
    if (!api_key || !search_engine_id) {
      console.error('Missing required environment variables for Google Search API');
      console.error(`GOOGLE_API_KEY present: ${!!api_key}, SEARCH_ENGINE_ID present: ${!!search_engine_id}`);
      return [];
    }

    const url = `https://www.googleapis.com/customsearch/v1?` +
      `key=${api_key}` +
      `&cx=${search_engine_id}` +
      `&q=${encodeURIComponent(query)}` +
      `&searchType=image`;

    try {
      console.log(`Searching for images with query: "${query}"`);
      const response = await fetch(url);
      
      // Log HTTP status for debugging
      console.log(`Google Search API responded with status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      // Check if items exist in the response
      if (!data.items || !Array.isArray(data.items)) {
        console.log('No items found in Google search response, data:', JSON.stringify(data).substring(0, 500) + '...');
        
        // Try a more generic search if the specific one failed
        if (query.length > 20) {
          console.log('Attempting fallback search with simplified query');
          const simplifiedQuery = query.split(' ').slice(0, 3).join(' ');
          return googleSearch(simplifiedQuery);
        }
        
        return []; // Return empty array if no items
      }

      const imageUrls = data.items.slice(0, 4).map(item => item.link);
      console.log(`Found ${imageUrls.length} images for query "${query}"`);
      return imageUrls;
    } catch (err) {
      console.error('Google search error:', err);
      return []; // Return empty array on error
    }
  };

  const fetchArticle = async (url) => {
    try {
      let browser;
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
        const executablePath = await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar')
        browser = await puppeteerCore.launch({
          executablePath,
          args: chromium.args,
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport
        });
      } else {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Extract all text content from the page
      const articleText = await page.evaluate(() => {
        // Remove script and style elements to avoid getting their content
        const scripts = document.querySelectorAll('script, style, noscript');
        scripts.forEach(script => script.remove());
        return document.body.innerText;
        console.log(document.body.innerText);
      });

      await browser.close();
      console.log(articleText);
      return articleText;
    } catch (error) {
      console.error('Error fetching article:', error);
      return 'Failed to extract article content';
    }
  }

  try {
    const cookieStore = await cookies();
    const linkedinProfileCookie = await cookieStore.get('linkedin_profile')?.value;

    if (!linkedinProfileCookie) {
      return NextResponse.json(
        { message: "Authentication required. Please sign in with LinkedIn." },
        { status: 401 }
      );
    }

    const linkedinProfile = JSON.parse(linkedinProfileCookie);
    const linkedinId = linkedinProfile.linkedinId;

    const { title, prompt, articleUrl } = await request.json();

    const articleData = await fetchArticle(articleUrl);
    console.log(articleData);

    const user = await userModel.findOne({ linkedinId });
    const linkedinSpecs = user.linkedinSpecs;

    // Concatenate instructions and user data in one prompt string
    const instructionBlock = `
You are a LinkedIn post writing assistant named PingPost. 
Your main goal is to:
1) Mimic the user's unique writing style by studying their "post examples."
2) Create a new LinkedIn post based on the given title and prompt.
3) I want to create posts that is a combination of personal stories with clear value bombs.
3) Provide a concise Google search query ("googleSearchQuery") for an image that pairs well with the post.

The post should have a feel like you are talking to a friend but still maintain high engagement and reach.

**Viral Post Guidelines**:
- Start with a short, 1–2 line "hook" that shocks or intrigues.
- Provide a personal story or context that feels real and relatable (no corporate jargon, no typical "I'm grateful for…" or "Today I want to talk about…").
- Keep paragraphs very short (1–2 lines max).
- Use 3–5 clear takeaways or bullet points.
- Incorporate numbers or specific examples to illustrate points.
- End with a simple, direct engagement question.
- Maintain a raw, honest tone: it should feel like you're chatting with a friend and sharing behind-the-scenes lessons, not lecturing as a "guru." 
- If referencing failures or lessons learned, keep it conversational and real. 
- The overall style should sound fresh, personal, "no BS," and reflect the user's voice as seen in their "post examples."

This is the article content to base the post on: ${articleData}

User's Post Examples: ${linkedinSpecs.postExamples}
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

    // Fetch relevant images with better error handling
    console.log(`Attempting to fetch images for query: "${googleSearchQuery}"`);
    const imageUrls = await googleSearch(googleSearchQuery);
    
    // If no images found with the AI-generated query, try a fallback
    if (imageUrls.length === 0 && title) {
      console.log('No images found with AI query, trying fallback with title');
      const fallbackImages = await googleSearch(title);
      if (fallbackImages.length > 0) {
        console.log(`Found ${fallbackImages.length} images using title as fallback`);
        return NextResponse.json(
          {
            message: "Post generated successfully with fallback images",
            post: cleanedPost,
            googleSearchQuery,
            images: fallbackImages,
            imageSource: "fallback"
          },
          { status: 200 }
        );
      }
    }

    // Return final response to client
    return NextResponse.json(
      {
        message: imageUrls.length > 0 ? "Post generated successfully" : "Post generated but no images found",
        post: cleanedPost,
        googleSearchQuery,
        images: imageUrls,
        imageSource: "primary"
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