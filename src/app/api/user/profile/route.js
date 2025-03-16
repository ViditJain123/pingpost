import { cookies } from "next/headers";
import User from "@/models/userModel";
import dbConnect from "@/utils/dbConnect";

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const profileCookie = cookieStore.get("linkedin_profile");
    
    if (!profileCookie) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const profileData = JSON.parse(profileCookie.value);
    const linkedinId = profileData.linkedinId;

    await dbConnect();
    
    const user = await User.findOne({ linkedinId });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userData = {
      linkedinId: user.linkedinId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePicture: user.profilePicture,
      linkedinTokenExpiry: user.linkedinTokenExpiry,
      linkedinSpecs: user.linkedinSpecs,
      subscription: user.subscription
    };

    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
