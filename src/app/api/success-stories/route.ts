import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import { Feedback } from "@/lib/models/feedbackSchema";
import User from "@/lib/models/userSchema";

// GET - Fetch published success stories from feedback collection for public view
export async function GET(request: NextRequest) {
  try {
    await connect();

    // Ensure User model is registered for populate operation
    User;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get only published feedback entries that have success stories and consent
    const feedbackWithStories = await Feedback.find({ 
      isPublished: true,
      canSuccessStoryPost: true,
      successStory: { $exists: true, $ne: "" },
      userId: { $ne: null }
    })
      .populate("userId", "firstName lastName avatar")
      .sort({ date: -1 })
      .limit(limit);

    // Transform feedback data to match expected success story format
    const transformedStories = feedbackWithStories
      .filter(feedback => feedback.userId !== null)
      .map(feedback => ({
        _id: feedback._id,
        userId: feedback.userId,
        title: feedback.adminTitle || `${feedback.rating}-Star Experience`,
        description: feedback.successStory,
        publishedAt: feedback.date,
        rating: feedback.rating
      }));

    return NextResponse.json({
      success: true,
      data: transformedStories,
    });
  } catch (error) {
    console.error("Error fetching published success stories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch success stories" },
      { status: 500 }
    );
  }
}
