import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/userSchema";
import SuspendedUser from "@/lib/models/suspendedUserSchema";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";


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

// GET - Fetch all suspended users for admin
export async function GET(request: NextRequest) {
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { suspensionReason: { $regex: search, $options: "i" } },
      ];
    }

    // Get suspended users
    const suspendedUsers = await SuspendedUser.find(query)
      .sort({ suspendedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SuspendedUser.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: suspendedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching suspended users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch suspended users" },
      { status: 500 }
    );
  }
}

// PATCH - Unsuspend a user
export async function PATCH(request: NextRequest) {
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
    const suspendedUserId = searchParams.get("userId");

    if (!suspendedUserId) {
      return NextResponse.json(
        { success: false, message: "Suspended user ID is required" },
        { status: 400 }
      );
    }

    const suspendedUser = await SuspendedUser.findById(suspendedUserId);

    if (!suspendedUser) {
      return NextResponse.json(
        { success: false, message: "Suspended user not found" },
        { status: 404 }
      );
    }

    // Restore user to main users collection
    const restoredUserData = {
      _id: new Types.ObjectId(suspendedUser.originalUserId),
      firstName: suspendedUser.firstName,
      lastName: suspendedUser.lastName,
      email: suspendedUser.email,
      phone: suspendedUser.phone,
      title: suspendedUser.title,
      password: suspendedUser.password,
      avatar: suspendedUser.avatar,
      googleId: suspendedUser.googleId,
      isGoogleUser: suspendedUser.isGoogleUser,
      profileCompleted: suspendedUser.profileCompleted,
      createdAt: suspendedUser.originalCreatedAt,
      updatedAt: new Date(), // Update the updatedAt timestamp
    };

    // First, check if a user with this email already exists in the main collection
    const existingUser = await User.findOne({ email: suspendedUser.email });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists in the system",
        },
        { status: 409 }
      );
    }

   // ── BEGIN: avoid `googleId: null` unique-index collisions ──
    if (restoredUserData.googleId == null) {
      delete restoredUserData.googleId;
    }

    let insertResult;
    try {
      insertResult = await User.collection.insertOne(restoredUserData);
    } catch (err: any) {
      // if it still fails on a null‐googleId duplicate, strip again & retry
      if (err.code === 11000 && err.keyPattern?.googleId) {
        delete restoredUserData.googleId;
        insertResult = await User.collection.insertOne(restoredUserData);
      } else {
        throw err;
      }
    }

    if (!insertResult.acknowledged) {
      throw new Error("Failed to insert restored user");
    }
    // Get the inserted user for response
    const restoredUser = await User.findById(insertResult.insertedId);

    // Delete from suspended users collection
    await SuspendedUser.findByIdAndDelete(suspendedUser._id);

    return NextResponse.json({
      success: true,
      message: "User unsuspended successfully",
      user: restoredUser.toJSON(),
    });
  } catch (error) {
    console.error("Error unsuspending user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to unsuspend user" },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete a suspended user
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
    const suspendedUserId = searchParams.get("userId");

    if (!suspendedUserId) {
      return NextResponse.json(
        { success: false, message: "Suspended user ID is required" },
        { status: 400 }
      );
    }

    const suspendedUser = await SuspendedUser.findById(suspendedUserId);
    if (!suspendedUser) {
      return NextResponse.json(
        { success: false, message: "Suspended user not found" },
        { status: 404 }
      );
    }

    await SuspendedUser.findByIdAndDelete(suspendedUserId);

    return NextResponse.json({
      success: true,
      message: "Suspended user permanently deleted",
    });
  } catch (error) {
    console.error("Error deleting suspended user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete suspended user" },
      { status: 500 }
    );
  }
}
