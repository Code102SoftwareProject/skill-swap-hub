import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/userSchema";
import SuspendedUser from "@/lib/models/suspendedUserSchema";
import { Types } from "mongoose";

// GET: Fetch paginated, searchable, sortable, non-deleted users
export async function GET(request: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(request.url);
    // Page size selector support: validate and cap limit
    let limit = parseInt(searchParams.get("limit") || "10", 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Max page size is 100
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build query for non-deleted users and search
    const query: any = { isDeleted: { $ne: true } };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    const allowedSortFields = [
      "firstName",
      "lastName",
      "email",
      "title",
      "role",
      "createdAt",
    ];
    let sortBy = searchParams.get("sortBy") || "createdAt";
    let sortOrder = searchParams.get("sortOrder") || "desc";
    if (!allowedSortFields.includes(sortBy)) sortBy = "createdAt";
    const sortValue = sortOrder === "asc" ? 1 : -1;

    const users = await User.find(query)
      .sort({ [sortBy]: sortValue })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
        sortBy,
        sortOrder,
      },
    });
  } catch (error: any) {
    return new NextResponse("Error in fetching users" + error.message, {
      status: 500,
    });
  }
}

// DELETE: Soft delete a user by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ message: "ID not found" }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user Id" }, { status: 400 });
    }
    await connect();
    // Soft delete: set isDeleted to true
    const updatedUser = await User.findByIdAndUpdate(
      new Types.ObjectId(userId),
      { isDeleted: true },
      { new: true }
    );
    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found in the database" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "User is soft deleted", user: updatedUser },
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse("Error in deleting user" + error.message, {
      status: 500,
    });
  }
}

// PATCH: Suspend/unsuspend a user by ID
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ message: "ID not found" }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user Id" }, { status: 400 });
    }
    const body = await request.json();
    const { suspended, suspensionReason, suspensionNotes, adminId } = body;
    await connect();

    // Find the user
    const user = await User.findById(new Types.ObjectId(userId));
    if (!user) {
      return NextResponse.json(
        { message: "User not found in the database" },
        { status: 400 }
      );
    }

    if (suspended) {
      // Move user to suspended collection
      const suspendedUserData = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        title: user.title,
        password: user.password, // Keep the encrypted password
        avatar: user.avatar,
        googleId: user.googleId,
        isGoogleUser: user.isGoogleUser,
        profileCompleted: user.profileCompleted,
        originalCreatedAt: user.createdAt,
        originalUpdatedAt: user.updatedAt,
        suspendedAt: new Date(),
        suspendedBy: adminId || "admin",
        suspensionReason: suspensionReason || "No reason provided",
        suspensionNotes: suspensionNotes || "",
        originalUserId: user._id.toString(),
      };

      // Check if already suspended
      const existingSuspended = await SuspendedUser.findOne({
        email: user.email,
      });
      if (existingSuspended) {
        return NextResponse.json(
          { message: "User is already suspended" },
          { status: 400 }
        );
      }

      // Create suspended user record
      const suspendedUser = new SuspendedUser(suspendedUserData);
      await suspendedUser.save();

      // Remove from main users collection
      await User.findByIdAndDelete(user._id);

      return NextResponse.json(
        {
          message: "User suspended successfully",
          suspendedUser: suspendedUser.toJSON(),
        },
        { status: 200 }
      );
    } else {
      // This is an unsuspend operation, but it should be handled via the suspended-users API
      return NextResponse.json(
        {
          message: "To unsuspend a user, use the suspended-users API endpoint",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error in suspending user:", error);
    return new NextResponse("Error in suspending user: " + error.message, {
      status: 500,
    });
  }
}
