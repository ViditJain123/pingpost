import { NextResponse } from "next/server";

export async function GET(request) {
    const response = NextResponse.json({ success: true });

    response.cookies.delete('linkedin_profile');
    response.cookies.delete('linkedin_oauth_state');
  
    return response;
}