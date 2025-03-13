import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request) {
    const profile = await request.cookies.get("linkedin_profile");
    const path = request.nextUrl.pathname;
    const isApiRoute = path.startsWith('/api');

    if (path === '/' || isApiRoute) {
        return NextResponse.next();
    }

    if (!profile && (path.startsWith('/onboard') || path.startsWith('/app/home'))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (path.startsWith('/app/home') && profile) {
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
        '/((?!api/linkedin|api/auth|_next|fonts|favicon.ico).*)',
    ],
}