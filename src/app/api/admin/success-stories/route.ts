import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import { Feedback } from "@/lib/models/feedbackSchema";
import User from "@/lib/models/userSchema";
import Admin from "@/lib/models/adminSchema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest) {
  const token = request.cookies.get("adminToken")?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Fetch all feedback entries with success stories (for admin)
export async function GET(request: NextRequest) {
  try {
    console.log("Starting GET request for success stories");
    
    // Connect to database
    await connect();
    console.log("Database connected successfully");

    // Ensure User and Admin models are registered for populate operations
    User;
    Admin;
    console.log("Models registered");

    const adminData = await verifyAdminToken(request);
    console.log("Admin verification result:", adminData ? "Success" : "Failed");
    
    if (!adminData) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all"; // all, published, unpublished

    console.log("Query params:", { page, limit, search, status });

    const skip = (page - 1) * limit;

    // First, let's check if we can query the Feedback collection at all
    const totalFeedbackCount = await Feedback.countDocuments({});
    console.log(`Total feedback entries in database: ${totalFeedbackCount}`);
    
    // Check how many have success stories
    const feedbackWithStoriesCount = await Feedback.countDocuments({
      successStory: { $exists: true, $ne: "" }
    });
    console.log(`Feedback entries with success stories: ${feedbackWithStoriesCount}`);
    
    // Build query for feedback entries with success stories
    // Admin can see all success stories, not filtered by canSuccessStoryPost
    const query: any = {
      successStory: { $exists: true, $ne: "" }
    };
    
    if (search) {
      query.$or = [
        { adminTitle: { $regex: search, $options: "i" } },
        { successStory: { $regex: search, $options: "i" } },
        { feedback: { $regex: search, $options: "i" } }
      ];
    }

    if (status !== "all") {
      query.isPublished = status === "published";
    }

    console.log("MongoDB query:", JSON.stringify(query, null, 2));

    // Get feedback entries with success stories
    const feedbackWithStories = await Feedback.find(query)
      .populate("userId", "firstName lastName email avatar")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Add lean() for better performance

    console.log(`Found ${feedbackWithStories.length} feedback entries`);

    // Transform feedback data to match expected success story format
    const transformedStories = feedbackWithStories
      .filter(feedback => feedback.userId !== null)
      .map(feedback => {
        try {
          return {
            _id: feedback._id,
            userId: feedback.userId,
            title: feedback.adminTitle || `${feedback.rating || 5}-Star Experience`,
            description: feedback.successStory,
            feedback: feedback.feedback,
            rating: feedback.rating || 5,
            isPublished: feedback.isPublished || false,
            publishedAt: feedback.isPublished ? feedback.date : null,
            createdAt: feedback.date,
            updatedAt: feedback.date,
            displayName: feedback.isAnonymous ? 'Anonymous' : (feedback.displayName || 'Unknown User'),
            isAnonymous: feedback.isAnonymous || false,
            canSuccessStoryPost: feedback.canSuccessStoryPost || false
          };
        } catch (mapError) {
          console.error("Error transforming feedback:", mapError, feedback);
          return null;
        }
      })
      .filter(story => story !== null); // Remove any null entries from transformation errors

    console.log(`Transformed ${transformedStories.length} success stories`);

    const total = await Feedback.countDocuments(query);
    console.log(`Total documents matching query: ${total}`);

    const response = {
      success: true,
      data: {
        successStories: transformedStories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    };

    console.log("Returning response with", transformedStories.length, "stories");
    return NextResponse.json(response);
  } catch (error) {
    console.error("Detailed error in GET success stories:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error
    });
    return NextResponse.json(
      { success: false, message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// POST - Admin cannot create new success stories, only users can
// This endpoint is disabled as per requirements
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, message: "Admin cannot create new success stories. Only users can submit feedback with success stories." },
    { status: 403 }
  );
}

// PUT - Update a feedback entry's success story details
export async function PUT(request: NextRequest) {
  try {
    await connect();

    const adminData = await verifyAdminToken(request);
    if (!adminData) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, title, isPublished } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Feedback ID is required" },
        { status: 400 }
      );
    }

    // Find the feedback entry first to check canSuccessStoryPost
    const existingFeedback = await Feedback.findById(id);
    if (!existingFeedback) {
      console.error("Feedback entry not found with ID:", id);
      return NextResponse.json(
        { success: false, message: "Feedback entry not found" },
        { status: 404 }
      );
    }

    console.log("Existing feedback:", {
      id: existingFeedback._id,
      canSuccessStoryPost: existingFeedback.canSuccessStoryPost,
      isPublished: existingFeedback.isPublished,
      newPublishState: isPublished
    });

    // Only allow publishing if user gave consent (canSuccessStoryPost: true)
    if (isPublished === true && !existingFeedback.canSuccessStoryPost) {
      console.warn("Attempted to publish without consent");
      return NextResponse.json(
        { success: false, message: "Cannot publish success story without user consent" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    
    // Only allow updating admin title and publication status
    if (title !== undefined) updateData.adminTitle = title;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("userId", "firstName lastName email avatar");

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: "Feedback entry not found" },
        { status: 404 }
      );
    }

    // Transform response to match expected format
    const transformedStory = {
      _id: feedback._id,
      userId: feedback.userId,
      title: feedback.adminTitle || `${feedback.rating}-Star Experience`,
      description: feedback.successStory,
      feedback: feedback.feedback,
      rating: feedback.rating,
      isPublished: feedback.isPublished,
      publishedAt: feedback.isPublished ? feedback.date : null,
      createdAt: feedback.date,
      updatedAt: feedback.date,
      displayName: feedback.isAnonymous ? 'Anonymous' : feedback.displayName,
      isAnonymous: feedback.isAnonymous,
      canSuccessStoryPost: feedback.canSuccessStoryPost
    };

    return NextResponse.json({
      success: true,
      message: "Success story updated successfully",
      data: transformedStory,
    });
  } catch (error) {
    console.error("Detailed error in PUT success stories:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error
    });
    return NextResponse.json(
      { success: false, message: `Failed to update success story: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - Delete a feedback entry (success story)
export async function DELETE(request: NextRequest) {
  try {
    await connect();

    const adminData = await verifyAdminToken(request);
    if (!adminData) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: "Feedback entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Success story deleted successfully",
    });
  } catch (error) {
    console.error("Detailed error in DELETE success stories:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error
    });
    return NextResponse.json(
      { success: false, message: `Failed to delete success story: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
