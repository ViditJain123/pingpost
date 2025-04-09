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
    if (!profile && (path.startsWith('/onboard') || path.startsWith('/app/home'))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Unrestricted pages that don't require subscription check
    const unrestrictedPages = ['/', '/app/home', '/app/typenoai', '/app/profile', '/onboard'];
    if (unrestrictedPages.some(page => path === page || path.startsWith(page + '/'))) {
        // For these pages, only check if user data exists but don't check subscription
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

    // For all other pages, check subscription status
    if (profile) {
        try {
            // Check subscription status
            const subscriptionResponse = await fetch(new URL('/api/subscription/subscriptionStatus', request.url), {
                headers: {
                    Cookie: `linkedin_profile=${profile.value}`
                }
            });
            
            const subscriptionData = await subscriptionResponse.json();
            
            // If no active subscription, redirect to home page
            if (!subscriptionData.hasActiveSubscription) {
                return NextResponse.redirect(new URL('/app/home', request.url));
            }
        } catch (error) {
            console.error("Error checking subscription status:", error);
            // On error, default to restricting access
            return NextResponse.redirect(new URL('/app/home', request.url));
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