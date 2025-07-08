import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import SuccessStory from "@/lib/models/successStorySchema";

// GET - Fetch published success stories for public view
export async function GET(request: NextRequest) {
  try {
    await connect();

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
