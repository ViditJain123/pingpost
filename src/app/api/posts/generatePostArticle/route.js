import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import userModel from "@/models/userModel";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

      // Check if items exist in the response
      if (!data.items || !Array.isArray(data.items)) {
        console.log('No items found in Google search response:', data);
        return []; // Return empty array if no items
      }

      const imageUrls = data.items.slice(0, 4).map(item => item.link);
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

    // console.log(title);
    //  console.log(linkedinSpecs);

    const userMessage = "Title: " + title + "/n" + "Prompt: " + prompt + "/n" + "Post Examples: " + linkedinSpecs.postExamples + "/n" + "Article: " + articleData;

    //  console.log(userMessage);

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
    // console.log(response);

    const parsedContent = JSON.parse(response.content);
    //  console.log(parsedContent);

    const post = parsedContent.post;
    const googleSearchQuery = parsedContent.googleSearchQuery;

    console.log(googleSearchQuery);
    const imageUrls = await googleSearch(googleSearchQuery);
    //   console.log(imageUrls);

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