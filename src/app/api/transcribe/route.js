import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    
    // Forward the request to OpenAI's Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Whisper API Error (${response.status}): ${errorText}`);
      return NextResponse.json(
        { error: `Whisper API request failed with status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in transcribe API route:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}

export const maxDuration = 120;
