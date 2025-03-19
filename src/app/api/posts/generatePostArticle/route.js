import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import userModel from "@/models/userModel";
import OpenAI from "openai";
import { z } from "zod"; 
import { zodResponseFormat } from "openai/helpers/zod";

// Remove direct imports that cause build issues

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
      // Dynamically import puppeteer only when this function is called
      let puppeteer;
      let browser;
      
      if (process.env.NODE_ENV === 'production') {
        // In production (e.g. Vercel or AWS Lambda)
        const chromium = await import('@sparticuz/chromium');
        puppeteer = await import('puppeteer-core');
        
        browser = await puppeteer.default.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: true,
          ignoreHTTPSErrors: true,
        });
      } else {
        // In development
        puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
          headless: "new"
        });
      }
      
      const page = await browser.newPage();

      // Navigate to the provided URL and wait until network activity is low
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Extract plain text from the document body
      const text = await page.evaluate(() => document.body.innerText);

      await browser.close();

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