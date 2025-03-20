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

const remoteExecutablePath = "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar";

let browser;

async function getBrowser() {
  if (browser) return browser;

  try {
    if (process.env.NEXT_PUBLIC_VERCEL_ENVIRONMENT === "production") {
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
      try {
        // Try using puppeteer's built-in browser first
        browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          headless: 'new',
        });
      } catch (devError) {
        console.warn("Fallback to puppeteer-core due to error:", devError.message);
        // Fallback to puppeteer-core with explicit Chrome path
        browser = await puppeteerCore.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath:
            process.platform === 'win32'
              ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
              : process.platform === 'darwin'
                ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                : '/usr/bin/google-chrome',
          headless: 'new',
        });
      }
    }
    return browser;
  } catch (error) {
    console.error("Browser initialization error:", error);
    throw new Error(`Failed to launch browser: ${error.message}`);
  }
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

      // Set a reasonable timeout
      await page.setDefaultNavigationTimeout(30000);

      // Try to navigate to the URL
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      if (!response) {
        console.warn("No response received from page");
        await page.close();
        return "Could not load the article content due to connection issues.";
      }

      if (response.status() >= 400) {
        console.warn(`Page returned status code: ${response.status()}`);
        await page.close();
        return `Could not load the article - received status code ${response.status()}`;
      }

      // Extract plain text from the document body
      const text = await page.evaluate(() => {
        // Remove script and style elements that might contain code/CSS
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(s => s.remove());

        // Get main content or fallback to body
        const main = document.querySelector('main') || document.querySelector('article') || document.body;
        return main.innerText;
      });

      await page.close(); // Close the page but keep the browser instance

      // Return a reasonable amount of text
      return text.trim().substring(0, 10000);
    } catch (error) {
      console.error('Error scraping URL:', error);
      return `Failed to extract article content: ${error.message}`;
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