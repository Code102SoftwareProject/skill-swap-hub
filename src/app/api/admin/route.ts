import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Admin from "@/lib/models/adminSchema";
import { NextRequest } from "next/server";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * GET - Retrieves all admin accounts (without exposing passwords)
 * @returns JSON response with admin data or error message
 */
export const GET = async () => {
  try {
    // Connect to the database
    await connect();
    // Fetch all admins but exclude password fields
    const admins = await Admin.find().select("-password");
    return NextResponse.json(admins, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in fetching admin", error: error.message },
      { status: 500 }
    );
  }
};

/**
 * POST - Creates a new admin account
 * @param req Request containing admin credentials
 * @returns JSON response with created admin data or error message
 */
export const POST = async (req: NextRequest) => {
  try {
    // Parse request body
    const body = await req.json();
    const { username, email, password } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "All fields (username, email, password) are required" },
        { status: 400 }
      );
    }

    await connect();

    // Check if username or email is already in use
    const existing = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return NextResponse.json(
        { message: "Username or email already exists" },
        { status: 409 }
      );
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new admin
    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    // Prepare response without exposing password
    const responseAdmin = {
      _id: newAdmin._id,
      adminId: newAdmin.adminId,
      username: newAdmin.username,
      email: newAdmin.email,
    };

    return NextResponse.json(
      { message: "Admin created", admin: responseAdmin },
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
 * PATCH - Updates admin password
 * @param req Request containing adminId and new password
 * @returns JSON response with updated admin data or error message
 */
export const PATCH = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { adminId, password } = body;

    // Validate required fields
    if (!adminId || !password) {
      return NextResponse.json(
        { message: "adminId and password are required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ message: "Invalid adminId" }, { status: 400 });
    }

    await connect();

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update admin with new password and return updated document
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { password: hashedPassword },
      { new: true }
    ).select("-password");

    if (!updatedAdmin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Password updated", admin: updatedAdmin },
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
 * DELETE - Removes an admin account
 * @param req Request containing adminId as URL parameter
 * @returns JSON response with deleted admin data or error message
 */
export const DELETE = async (req: NextRequest) => {
  try {
    // Extract adminId from URL parameters
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");

    // Validate adminId presence
    if (!adminId) {
      return NextResponse.json(
        { message: "adminId is required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ message: "Invalid adminId" }, { status: 400 });
    }

    await connect();

    // Delete admin and return deleted document (without password)
    const deletedAdmin =
      await Admin.findByIdAndDelete(adminId).select("-password");

    if (!deletedAdmin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Admin deleted", admin: deletedAdmin },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in deleting admin", error: error.message },
      { status: 500 }
    );
  }
};
