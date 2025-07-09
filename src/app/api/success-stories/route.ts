import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import SuccessStory from "@/lib/models/successStorySchema";
import User from "@/lib/models/userSchema";

// GET - Fetch published success stories for public view
export async function GET(request: NextRequest) {
  try {
    await connect();

    // Ensure User model is registered for populate operation
    // This is required because the populate() method references the User model
    // and it needs to be explicitly imported to register it with Mongoose
    User;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get only published success stories
    const successStories = await SuccessStory.find({ isPublished: true })
      .populate("userId", "firstName lastName avatar")
      .sort({ publishedAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: successStories,
    });
  } catch (error) {
    console.error("Error fetching published success stories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch success stories" },
      { status: 500 }
    );
  }
}
