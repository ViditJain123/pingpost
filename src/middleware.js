import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request) {
    const profile = await request.cookies.get("linkedin_profile");
    const path = request.nextUrl.pathname;
    const isApiRoute = path.startsWith('/api');

    // Allow API routes and home page
    if (path === '/' || isApiRoute) {
        return NextResponse.next();
    }

    // Redirect to login page if not logged in
    if (!profile && (path.startsWith('/onboard') || path.startsWith('/app/'))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Check if user has completed onboarding
    if (path.startsWith('/app/') && profile) {
        try {
            const response = await fetch(new URL('/api/onboard/getUserData', request.url), {
                headers: {
                    Cookie: `linkedin_profile=${profile.value}`
                }
            });
            
            const data = await response.json();
            
            if (data.status === 404 || (data.body && !data.body.linkedinSpecs)) {
                return NextResponse.redirect(new URL('/onboard', request.url));
            }
        } catch (error) {
            console.error("Error checking user data:", error);
            return NextResponse.redirect(new URL('/onboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Exclude static files and include only specific paths that need middleware
        '/((?!api/linkedin|api/auth|_next|fonts|favicon.ico|.*\\..*).*)',
    ],
}