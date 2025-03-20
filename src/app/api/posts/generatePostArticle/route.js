import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import userModel from "@/models/userModel";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";

// Set dynamic rendering to force server-side execution each time
export const dynamic = "force-dynamic";

// Browser instance cache
let browser;

// Function to get or create a browser instance
async function getBrowser() {
  if (browser) return browser;

  if (process.env.NEXT_PUBLIC_VERCEL_ENVIRONMENT === "production") {
    const remoteExecutablePath = "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar";
    browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(remoteExecutablePath),
      headless: true,
    });
  } else {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
  }
  return browser;
}

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
      const browser = await getBrowser();
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Extract plain text from the document body
      const text = await page.evaluate(() => document.body.innerText);

      await page.close(); // Close the page but keep the browser instance
      
      return text.trim();
    } catch (error) {
      console.error('Error scraping URL:', error);
      return '';
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

// Add a GET endpoint to check page status
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  
  if (!url) {
    return new Response(
      JSON.stringify({ error: "URL parameter is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  let statusCode;
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: "domcontentloaded" });
    statusCode = response && response.status() === 200 ? 200 : 404;
    await page.close();
  } catch (error) {
    console.error("Error accessing page:", error);
    statusCode = 404;
  }
  
  return new Response(
    JSON.stringify({
      statusCode: statusCode === 200 ? 200 : 404,
      is200: statusCode === 200,
    }),
    {
      status: statusCode === 200 ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}