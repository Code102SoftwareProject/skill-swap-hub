import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import SuccessStory from "@/lib/models/successStorySchema";
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

// GET - Fetch all success stories (for admin)
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

    // Build query
    const query: any = {
      userId: { $ne: null } // Exclude stories where userId is null
    };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== "all") {
      query.isPublished = status === "published";
    }

    // Get success stories with user details
    const successStories = await SuccessStory.find(query)
      .populate("userId", "firstName lastName email avatar")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Additional filter to ensure populated userId is not null
    const validStories = successStories.filter(story => story.userId !== null);

    const total = await SuccessStory.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        successStories: validStories,
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

// POST - Create a new success story
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

    const { userId, title, description, image, isPublished } = await request.json();

    // Validate required fields
    if (!userId || !title || !description) {
      return NextResponse.json(
        { success: false, message: "User ID, title, and description are required" },
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

    // Create success story
    const successStory = new SuccessStory({
      userId,
      title,
      description,
      image,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      createdBy: adminData.userId,
    });

    await successStory.save();

    // Populate user details for response
    await successStory.populate("userId", "firstName lastName email avatar");
    await successStory.populate("createdBy", "username");

    return NextResponse.json({
      success: true,
      message: "Success story created successfully",
      data: successStory,
    });
  } catch (error) {
    console.error("Error creating success story:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create success story" },
      { status: 500 }
    );
  }
}

// PUT - Update a success story
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

    const { id, title, description, image, isPublished } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Success story ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      updateData.publishedAt = isPublished ? new Date() : null;
    }

    const successStory = await SuccessStory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("userId", "firstName lastName email avatar")
      .populate("createdBy", "username");

    if (!successStory) {
      return NextResponse.json(
        { success: false, message: "Success story not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Success story updated successfully",
      data: successStory,
    });
  } catch (error) {
    console.error("Error updating success story:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update success story" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a success story
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
        { success: false, message: "Success story ID is required" },
        { status: 400 }
      );
    }

    const successStory = await SuccessStory.findByIdAndDelete(id);

    if (!successStory) {
      return NextResponse.json(
        { success: false, message: "Success story not found" },
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
