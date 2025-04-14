import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import connect from "@/lib/db";
import Admin from "@/lib/models/adminSchema";

/**
 * GET /api/admin
 * 🔍 Fetch all admin users
 */
export const GET = async (req: Request) => {
  try {
    await connect();
    const admins = await Admin.find().select("-password"); // ❌ Do not return password
    return NextResponse.json(admins, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in fetching admins", error: error.message },
      { status: 500 }
    );
  }
};

/**
 * POST /api/admin
 * ➕ Create a new admin with hashed password
 */
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { username, password } = body;

    // 🚫 Check for missing fields
    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    await connect();

    // 🚫 Prevent duplicate admins
    const existing = await Admin.findOne({ username });
    if (existing) {
      return NextResponse.json(
        { message: "Admin already exists" },
        { status: 409 }
      );
    }

    // 🔐 Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();

    // ✅ Return created admin (excluding password)
    const responseAdmin = {
      _id: newAdmin._id,
      username: newAdmin.username,
      role: newAdmin.role,
    };

    return NextResponse.json(
      { message: "Admin created successfully", admin: responseAdmin },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in creating admin", error: error.message },
      { status: 500 }
    );
  }
};

/**
 * PATCH /api/admin
 * ✏️ Update an admin's password
 */
export const PATCH = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { adminId, password } = body;

    // 🚫 Validate input
    if (!adminId || !password) {
      return NextResponse.json(
        { message: "Admin ID and new password are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { message: "Invalid admin ID format" },
        { status: 400 }
      );
    }

    await connect();

    // 🔐 Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { password: hashedPassword },
      { new: true }
    ).select("-password"); // ❌ Don't return password

    if (!updatedAdmin) {
      return NextResponse.json(
        { message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Admin updated successfully", admin: updatedAdmin },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in updating admin", error: error.message },
      { status: 500 }
    );
  }
};

/**
 * DELETE /api/admin?adminId=xyz
 * 🗑 Delete an admin by ID
 */
export const DELETE = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");

    // 🚫 Check adminId
    if (!adminId) {
      return NextResponse.json(
        { message: "Admin ID is required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { message: "Invalid admin ID format" },
        { status: 400 }
      );
    }

    await connect();

    const deletedAdmin = await Admin.findByIdAndDelete(adminId).select("-password");

    if (!deletedAdmin) {
      return NextResponse.json(
        { message: "Admin not found in the database" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Admin deleted successfully", admin: deletedAdmin },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in deleting admin", error: error.message },
      { status: 500 }
    );
  }
};
