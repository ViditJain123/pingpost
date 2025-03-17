import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "GET request to modifyPost test route successful" });
}

export async function POST(request) {
  try {
    // This is just a test route - in a real implementation you would process the request body
    const body = await request.json();
    
    return NextResponse.json({ 
      message: "POST request to modifyPost test route successful", 
      receivedData: body 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error processing request", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    
    return NextResponse.json({ 
      message: "PUT request to modifyPost test route successful", 
      receivedData: body 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error processing request", details: error.message },
      { status: 500 }
    );
  }
}
