import { NextResponse } from "next/server";
import  connect  from "@/lib/db";
import { Types } from "mongoose";
import User from "@/lib/models/userSchema";

// 🟩Fetch all users
export const GET = async () => {
  try {
    await connect();
    // Only return users that are not soft deleted
    const users = await User.find({ isDeleted: { $ne: true } });
    return new NextResponse(JSON.stringify(users), { status: 200 });
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
