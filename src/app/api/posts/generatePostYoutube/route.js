import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import userModel from "@/models/userModel";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { YoutubeTranscript } from "youtube-transcript";

export async function POST(request) {
  await dbConnect();

  const client = new OpenAI(process.env.OPENAI_API_KEY);

  const outputSchema = z.object({
    post: z.string(),
    googleSearchQuery: z.string()
  });

  const googleSearch = async (query) => {
    const api_key = process.env.GOOGLE_API_KEY;
    const search_engine_id = process.env.SEARCH_ENGINE_ID;

    const url = `https://www.googleapis.com/customsearch/v1?` +
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
      const imageUrls = items.slice(0, 4).map(item => item.link);
      return imageUrls;
    } catch (err) {
      console.error(err);
    }
  };

  const fetchArticle = async (url) => {
    try {
      // Extract video ID if a full URL is provided
      let videoId = url;

      // Handle different YouTube URL formats
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const urlObj = new URL(url);
        if (url.includes('youtube.com/watch')) {
          videoId = urlObj.searchParams.get('v');
        } else if (url.includes('youtu.be/')) {
          videoId = urlObj.pathname.split('/')[1];
        } else if (url.includes('youtube.com/embed/')) {
          videoId = urlObj.pathname.split('/')[2];
        }
      } else if (!url.includes('youtube.com') && !url.includes('youtu.be') && url.length === 11) {
        // If it's just the 11-character video ID, use it directly
        videoId = url;
      } else {
        // Not a recognizable YouTube URL or ID
        console.log("Invalid YouTube URL or ID format");
        return "Invalid YouTube URL or ID format. Please provide a valid YouTube URL or video ID.";
      }

      if (!videoId) {
        console.log("Could not extract video ID from URL");
        return "Could not extract video ID from the provided URL. Please check the URL format.";
      }

      console.log("Extracted Video ID: " + videoId);
      
      try {
        // Make sure we're only passing the video ID, not the full URL
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript || transcript.length === 0) {
          console.log("No transcript found for the video");
          return "No transcript available for this video. Please provide additional context in your prompt.";
        }
        
        // For debugging, log a small portion of the transcript
        console.log("Transcript sample (first 100 chars):", transcript.map(item => item.text).join(' ').substring(0, 100) + "...");
        return transcript.map(item => item.text).join(' ');
      } catch (transcriptError) {
        console.error("Error fetching YouTube transcript:", transcriptError);
        
        // Handle specific error for disabled transcripts
        if (transcriptError.message && transcriptError.message.includes("disabled on this video")) {
          return "Transcript is disabled for this video. Please provide additional context about the video content in your prompt.";
        }
        
        // Generic error handling
        return "Unable to retrieve transcript from this video. Please provide additional context about the video content in your prompt.";
      }
    } catch (err) {
      console.error("Error processing YouTube URL:", err);
      return "Invalid YouTube URL or ID. Please check the URL and try again.";
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

    // Check if we got a valid transcript or an error message
    if (articleData.includes("disabled for this video") || 
        articleData.includes("Unable to retrieve transcript") || 
        articleData.includes("Invalid YouTube URL")) {
      // Still proceed, but let the user know about the transcript issue
      console.log("Proceeding with limited video data:", articleData);
    }

    const user = await userModel.findOne({ linkedinId });
    const linkedinSpecs = user.linkedinSpecs;

    console.log(title);
    console.log(linkedinSpecs);

    const userMessage = "Title: " + title + "/n" + "Prompt: " + prompt + "/n" + "Post Examples: " + linkedinSpecs.postExamples + "/n" + "Article: " + articleData;

    console.log(userMessage);

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "developer",
          content: `You are a LinkedIn post writing assistant named PingPost. 
Your main goal is to:
1) Mimic the user's unique writing style by studying their "post examples."
2) Create a new LinkedIn post based on the given title and prompt.
3) I want to create posts that is a combination of personal stories with clear value bombs.
3) Provide a concise Google search query ("googleSearchQuery") for an image that pairs well with the post.

The post should have a feel like you are talking to a friend but still maintain high engagement and reach.

**Viral Post Guidelines**:
- Start with a short, 1–2 line “hook” that shocks or intrigues.
- Provide a personal story or context that feels real and relatable (no corporate jargon, no typical “I’m grateful for…” or “Today I want to talk about…”).
- Keep paragraphs very short (1–2 lines max).
- Use 3–5 clear takeaways or bullet points.
- Incorporate numbers or specific examples to illustrate points.
- End with a simple, direct engagement question.
- Maintain a raw, honest tone: it should feel like you’re chatting with a friend and sharing behind-the-scenes lessons, not lecturing as a “guru.” 
- If referencing failures or lessons learned, keep it conversational and real. 
- The overall style should sound fresh, personal, “no BS,” and reflect the user’s voice as seen in their “post examples.”

Also - Donnot use ** to highlight any words as we can't use it in linkedin post. It has to be plain text.

**Output**:
Return valid JSON matching the schema: 
{
  "post": "string - the actual LinkedIn post text",
  "googleSearchQuery": "string - a short image query to help find a relevant image"
}

Make sure your JSON is well-formed (no extra keys, no trailing commas). If any details are missing, make reasonable assumptions. `
        },
        {
          role: "user",
          content: `This is the article content: ${articleData} You have to use this article content to create the post.`
        },
        {
          role: "user",
          content: `Title: ${title} /n Prompt: ${prompt}`
        },
      ],
      response_format: zodResponseFormat(outputSchema, "json"),
    });

    const response = completion.choices[0].message;
    console.log(response);

    const parsedContent = JSON.parse(response.content);
    console.log(parsedContent);

    const post = parsedContent.post;
    const googleSearchQuery = parsedContent.googleSearchQuery;

    console.log(googleSearchQuery);
    const imageUrls = await googleSearch(googleSearchQuery);
    console.log(imageUrls);

    return NextResponse.json(
      {
        message: "Post generated successfully",
        post,
        googleSearchQuery,
        images: imageUrls
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