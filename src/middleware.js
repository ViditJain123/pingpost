import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request) {
    const profile = await request.cookies.get("linkedin_profile");
    const path = request.nextUrl.pathname;
    const isApiRoute = path.startsWith('/api');

    // Allow root path and API routes freely
    if (path === '/' || isApiRoute) {
        return NextResponse.next();
    }

    // Redirect to root if no profile and trying to visit /onboard or /home
    if (!profile && (path.startsWith('/onboard') || path.startsWith('app/home'))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api/linkedin|api/auth|_next|fonts|favicon.ico).*)',
    ],
}