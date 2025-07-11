import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import User from "@/lib/models/userSchema";
import { Types } from "mongoose";

// GET: Fetch paginated, searchable, sortable, non-deleted users
export async function GET(request: NextRequest) {
  try {
    await connect();
    const { searchParams } = new URL(request.url);
    // Page size selector support: validate and cap limit
    let limit = parseInt(searchParams.get('limit') || '10', 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Max page size is 100
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build query for non-deleted users and search
    const query: any = { isDeleted: { $ne: true } };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ];
    }

    const allowedSortFields = ['firstName', 'lastName', 'email', 'title', 'role', 'createdAt'];
    let sortBy = searchParams.get('sortBy') || 'createdAt';
    let sortOrder = searchParams.get('sortOrder') || 'desc';
    if (!allowedSortFields.includes(sortBy)) sortBy = 'createdAt';
    const sortValue = sortOrder === 'asc' ? 1 : -1;

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
    return new NextResponse("Error in fetching users" + error.message, { status: 500 });
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
      return NextResponse.json({ message: "User not found in the database" }, { status: 400 });
    }
    return NextResponse.json({ message: "User is soft deleted", user: updatedUser }, { status: 200 });
  } catch (error: any) {
    return new NextResponse("Error in deleting user" + error.message, { status: 500 });
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
    const { suspended, suspensionReason } = body;
    await connect();
    const update: any = {
      'suspension.isSuspended': !!suspended,
      'suspension.suspendedAt': suspended ? new Date() : null,
      'suspension.reason': suspended ? suspensionReason : null,
    };
    const updatedUser = await User.findByIdAndUpdate(
      new Types.ObjectId(userId),
      update,
      { new: true }
    );
    if (!updatedUser) {
      return NextResponse.json({ message: "User not found in the database" }, { status: 400 });
    }
    return NextResponse.json({ message: suspended ? "User suspended" : "User unsuspended", user: updatedUser }, { status: 200 });
  } catch (error: any) {
    return new NextResponse("Error in suspending user" + error.message, { status: 500 });
  }
}
