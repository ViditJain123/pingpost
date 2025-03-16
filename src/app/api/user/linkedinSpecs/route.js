import { cookies } from "next/headers";
import User from "@/models/userModel";
import dbConnect from "@/utils/dbConnect";

export async function PUT(req) {
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

    const body = await req.json();
    const { linkedinSpecs } = body;

    if (!linkedinSpecs) {
      return new Response(JSON.stringify({ error: "LinkedIn specs data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await dbConnect();
    
    const updatedUser = await User.findOneAndUpdate(
      { linkedinId },
      { linkedinSpecs },
      { new: true }
    );

    if (!updatedUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("LinkedIn specs update error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
