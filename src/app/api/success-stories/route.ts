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
      .populate("userId", "firstName lastName avatar") // Only for avatar, we'll use displayName instead
      .sort({ date: -1 })
      .limit(limit);

    // Transform feedback data to match expected success story format
    const transformedStories = feedbackWithStories
      .filter(feedback => feedback.userId !== null)
      .map(feedback => {
        // Determine display name based on user preferences
        let displayName;
        if (feedback.isAnonymous) {
          // User chose "Do not display my name publicly"
          displayName = "Anonymous";
        } else if (feedback.displayName && feedback.displayName.trim() && feedback.displayName.trim() !== "User") {
          // User provided a custom display name (but not the generic "User" fallback)
          displayName = feedback.displayName.trim();
        } else {
          // User didn't choose anonymous AND didn't provide display name = show actual name
          // This also handles cases where displayName is "User" from old data
          displayName = `${feedback.userId.firstName} ${feedback.userId.lastName}`.trim();
        }

        return {
          _id: feedback._id,
          // Create user object with safe public data only
          userId: {
            _id: feedback.userId._id,
            firstName: displayName.split(' ')[0] || displayName, // For backward compatibility
            lastName: displayName.split(' ').slice(1).join(' ') || '', // For backward compatibility
            avatar: feedback.userId.avatar
          },
          user: {
            name: displayName,
            avatar: feedback.userId.avatar
          },
          title: feedback.adminTitle || `${feedback.rating}-Star Experience`,
          description: feedback.successStory,
          publishedAt: feedback.date,
          rating: feedback.rating,
          isAnonymous: feedback.isAnonymous
        };
      });

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
