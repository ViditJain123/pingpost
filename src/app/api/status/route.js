import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
    const cookieStore = await cookies();
    const profileCookie = await cookieStore.get("linkedin_profile");

    return NextResponse.json(
        {isAuthenticated: !!profileCookie}
    );
}