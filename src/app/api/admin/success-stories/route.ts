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
    await connect();

    // Ensure User and Admin models are registered for populate operations
    User;
    Admin;

    const adminData = await verifyAdminToken(request);
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

    const skip = (page - 1) * limit;

    // Build query for feedback entries with success stories
    const query: any = {
      userId: { $ne: null },
      canSuccessStoryPost: true,
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

    // Get feedback entries with success stories
    const feedbackWithStories = await Feedback.find(query)
      .populate("userId", "firstName lastName email avatar")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Transform feedback data to match expected success story format
    const transformedStories = feedbackWithStories
      .filter(feedback => feedback.userId !== null)
      .map(feedback => ({
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
        displayName: feedback.displayName,
        isAnonymous: feedback.isAnonymous
      }));

    const total = await Feedback.countDocuments(query);

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching success stories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch success stories" },
      { status: 500 }
    );
  }
}

// POST - Create a new feedback entry with success story (admin-created)
export async function POST(request: NextRequest) {
  try {
    await connect();

    const adminData = await verifyAdminToken(request);
    if (!adminData) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, title, description, feedback, rating, isPublished } = await request.json();

    // Validate required fields
    if (!userId || !description || !feedback) {
      return NextResponse.json(
        { success: false, message: "User ID, success story, and feedback are required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Create feedback entry with success story
    const feedbackEntry = new Feedback({
      userId,
      feedback: feedback,
      successStory: description,
      rating: rating || 5,
      adminTitle: title,
      canSuccessStoryPost: true,
      isAnonymous: false,
      isPublished,
      displayName: `${user.firstName} ${user.lastName}`,
    });

    await feedbackEntry.save();

    // Populate user details for response
    await feedbackEntry.populate("userId", "firstName lastName email avatar");

    // Transform response to match expected format
    const transformedStory = {
      _id: feedbackEntry._id,
      userId: feedbackEntry.userId,
      title: feedbackEntry.adminTitle || `${feedbackEntry.rating}-Star Experience`,
      description: feedbackEntry.successStory,
      feedback: feedbackEntry.feedback,
      rating: feedbackEntry.rating,
      isPublished: feedbackEntry.isPublished,
      publishedAt: feedbackEntry.isPublished ? feedbackEntry.date : null,
      createdAt: feedbackEntry.date,
      updatedAt: feedbackEntry.date,
      displayName: feedbackEntry.displayName,
      isAnonymous: feedbackEntry.isAnonymous
    };

    return NextResponse.json({
      success: true,
      message: "Success story created successfully",
      data: transformedStory,
    });
  } catch (error) {
    console.error("Error creating success story:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create success story" },
      { status: 500 }
    );
  }
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
      displayName: feedback.displayName,
      isAnonymous: feedback.isAnonymous
    };

    return NextResponse.json({
      success: true,
      message: "Success story updated successfully",
      data: transformedStory,
    });
  } catch (error) {
    console.error("Error updating success story:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update success story" },
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
    console.error("Error deleting success story:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete success story" },
      { status: 500 }
    );
  }
}
