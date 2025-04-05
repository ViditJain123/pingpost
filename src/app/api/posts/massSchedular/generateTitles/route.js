import dbConnect from "@/utils/dbConnect";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import userModel from "@/models/userModel";
import Titles from "@/models/titlesModel";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

export async function GET(request) {
  await dbConnect();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const outputSchema = z.object({
    titles: z.array(z.string())
  });

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

    const count = 30;

    const user = await userModel.findOne({ linkedinId });
    
    // Find existing titles and update their status to rejected
    const existingTitlesDoc = await Titles.findOne({ linkedinId });
    if (existingTitlesDoc) {
      await Titles.updateOne(
        { linkedinId },
        { status: "rejected" }
      );
    }
    
    const linkedinSpecs = user.linkedinSpecs;

    const userMessage = `Number of titles: ${count}\nUser's LinkedIn profile: ${linkedinSpecs.headline}\nIndustry: ${linkedinSpecs.industry}`;

    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a LinkedIn content strategist. Generate ${count} engaging, professional post titles appropriate for the user's industry and profession. Each title should be concise (under 100 characters) and compelling. Make them varied in style (questions, statements, listicles, etc.).`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        response_format: zodResponseFormat(outputSchema, "json"),
      });

      const response = completion.choices[0].message;
      const parsedContent = JSON.parse(response.content);
      
      // Transform string titles to objects with title and titleStatus
      const formattedTitles = parsedContent.titles.map(titleText => ({
        title: titleText,
        titleStatus: "unselected"
      }));

      // Save titles to database with the new structure
      await Titles.findOneAndUpdate(
        { linkedinId },
        { 
          linkedinId, 
          titles: formattedTitles,
          status: "ingame" // Ensure the new document has the default status
        },
        { upsert: true, new: true }
      );

      return NextResponse.json(
        { 
          message: "Titles generated successfully", 
          titles: formattedTitles 
        },
        { status: 200 }
      );
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json(
        { message: "Error with AI service", error: openaiError.message },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Error generating titles", error: err.message },
      { status: 500 }
    );
  }
}
