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
      }

      console.log("Video ID: " + videoId);
      
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript || transcript.length === 0) {
          console.log("No transcript found for the video");
          return "No transcript available for this video. Please provide additional context in your prompt.";
        }
        
        console.log(transcript.map(item => item.text).join(' '));
        return transcript.map(item => item.text).join(' ');
      } catch (transcriptError) {
        console.error("Error fetching YouTube transcript:", transcriptError);
        
        // Handle specific error for disabled transcripts
        if (transcriptError.message.includes("disabled on this video")) {
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
          content: "You are a linkedin post writer and you have to write post about the title and prompt given to you by the user. You have to write the post in the exact same tone and style as the user. The user will be attaching the post he has written in the past and you will have to copy the style and tone of the user. You also have to give a search query related to the title and prompt that I can give to google to find a relavent image for the post that I can attach to it for my linkedin."
        },
        {
          role: "developer",
          content: userMessage
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