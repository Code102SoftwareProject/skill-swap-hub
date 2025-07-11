import { NextResponse } from "next/server";
import  connect  from "@/lib/db";
import { Types } from "mongoose";
import User from "@/lib/models/userSchema";

// 🟩Fetch all users
export const GET = async (request: Request) => {
  try {
    await connect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
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

    return new NextResponse(
      JSON.stringify({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        sortBy,
        sortOrder,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    return new NextResponse("Error in fetching users" + error.message, { status: 500 });
  }
};


// 🟩Remove a user by ID
export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ message: "ID not found" }),
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid user Id" }),
        { status: 400 }
      );
    }

    await connect();

    // Soft delete: set isDeleted to true
    const updatedUser = await User.findByIdAndUpdate(
      new Types.ObjectId(userId),
      { isDeleted: true },
      { new: true }
    );

    if (!updatedUser) {
      return new NextResponse(
        JSON.stringify({ message: "User not found in the database" }),
        { status: 400 }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: "User is soft deleted", user: updatedUser }),
      { status: 200 }
    );

  } catch (error: any) {
    return new NextResponse("Error in deleting user" + error.message, { status: 500 });
  }
};
