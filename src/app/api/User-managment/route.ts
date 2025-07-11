import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/userSchema";
import SuspendedUser from "@/lib/models/suspendedUserSchema";
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

// GET - Fetch all users for admin
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
      ];
    }

    // Get users without password
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: users,
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
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user
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
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}

// PATCH - Suspend/Unsuspend a user
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
    const userId = searchParams.get("userId");
    const body = await request.json();
    const {
      suspended,
      suspensionReason = "Policy violation",
      suspensionNotes,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (suspended) {
      // Move user to suspended users collection
      const suspendedUserData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        title: user.title,
        password: user.password,
        avatar: user.avatar,
        googleId: user.googleId,
        isGoogleUser: user.isGoogleUser,
        profileCompleted: user.profileCompleted,
        originalCreatedAt: user.createdAt,
        originalUpdatedAt: user.updatedAt,
        suspendedAt: new Date(),
        suspendedBy: adminData.userId,
        suspensionReason,
        suspensionNotes,
        originalUserId: user._id.toString(),
      };

      // Create suspended user record
      const suspendedUser = new SuspendedUser(suspendedUserData);
      await suspendedUser.save();

      // Delete user from main users collection
      await User.findByIdAndDelete(userId);

      return NextResponse.json({
        success: true,
        message: "User suspended successfully",
        suspendedUser: suspendedUser.toJSON(),
      });
    } else {
      // Unsuspend user - move from suspended users back to main users
      const suspendedUser = await SuspendedUser.findOne({
        originalUserId: userId,
      });

      if (!suspendedUser) {
        return NextResponse.json(
          { success: false, message: "Suspended user not found" },
          { status: 404 }
        );
      }

      // Restore user to main users collection
      const restoredUserData = {
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
        updatedAt: suspendedUser.originalUpdatedAt,
      };

      const restoredUser = new User(restoredUserData);
      await restoredUser.save();

      // Delete from suspended users collection
      await SuspendedUser.findByIdAndDelete(suspendedUser._id);

      return NextResponse.json({
        success: true,
        message: "User unsuspended successfully",
        user: restoredUser.toJSON(),
      });
    }
  } catch (error) {
    console.error("Error updating user suspension:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user suspension" },
      { status: 500 }
    );
  }
}
