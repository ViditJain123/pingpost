import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import axios from "axios";
import dbConnect from "@/utils/dbConnect";
import userModel from "@/models/userModel";

export async function GET(request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const cookieStore = await cookies();
    const storedState = await cookieStore.get("linkedin_oauth_state")?.value;

    if (!state || state !== storedState) {
        console.error("State Mismatch");
        return NextResponse.redirect(new URL('/signin', request.url));
    }

    const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    const params = new URLSearchParams({
        grant_type: "authorization_code",
        code: code || '',
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    })

    const tokenResponse = await axios.post(tokenUrl, params, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });

    const tokenData = tokenResponse.data;
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    if (!accessToken || !idToken) {
        console.error("Access Token Missing");
        return NextResponse.redirect(new URL('/', request.url));
    }

    const profileData = jwt.decode(idToken);
    console.log(profileData);

    const userData = {
        linkedinId: profileData.sub,
        firstName: profileData.given_name,
        lastName: profileData.family_name,
        email: profileData.email,
        profilePicture: profileData.picture,
        linkedinAccessToken: accessToken, // Store the access token
        linkedinTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000), // Store token expiry
        postScheduleFix: false,
        postScheduleFixTime: null,
    };

    const user = await userModel.findOne({ linkedinId: userData.linkedinId });

    try {
        if (user) {
            // Update the user with the new access token
            user.linkedinAccessToken = accessToken;
            user.linkedinTokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
            await user.save();
            
            // Check if user exists and has linkedinSpecs with audience
            if (user.linkedinSpecs && user.linkedinSpecs.audience) {
                console.log("Existing user with specs");
                const response = NextResponse.redirect(new URL('/app/home', request.url));
                response.cookies.set('linkedin_profile', JSON.stringify(userData));
                return response;
            } else {
                console.log("Existing user without specs");
                const response = NextResponse.redirect(new URL('/onboard', request.url));
                response.cookies.set('linkedin_profile', JSON.stringify(userData));
                return response;
            }
        } else {
            console.log("New user");
            const newUser = new userModel(userData);
            await newUser.save();
            const response = NextResponse.redirect(new URL('/onboard', request.url));
            response.cookies.set('linkedin_profile', JSON.stringify(userData));
            return response;
        }
    } catch (error) {
        console.error("Error during user processing:", error);
        return NextResponse.redirect(new URL('/', request.url));
    }
}