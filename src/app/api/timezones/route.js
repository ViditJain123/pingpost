import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all available timezones using Intl API
    const timezones = Intl.supportedValuesOf('timeZone');
    
    return NextResponse.json({
      status: 200,
      timezones
    });
  } catch (error) {
    console.error("Error fetching timezones:", error);
    return NextResponse.json({
      status: 500,
      error: "Failed to fetch timezones"
    }, { status: 500 });
  }
}
