import connect from "@/lib/db";
import { NextResponse } from "next/server";
import Admin from "@/lib/models/adminSchema";
import { NextRequest } from "next/server";
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * GET: Fetch all admins (excluding passwords)
 */
export const GET = async () => {
  try {
    await connect();
    const admins = await Admin.find().select("-password"); // 🚫 Hide sensitive data
    return NextResponse.json(admins, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error in fetching admin", error: error.message },
      { status: 500 }
    );
  }
};

/**
 * POST: Create a new admin with hashed password and auto-generated adminId
 */
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    // ✅ Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "All fields (username, email, password) are required" },
        { status: 400 }
      );
    }

    await connect();

    // 🔎 Check if user already exists
    const existing = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return NextResponse.json(
        { message: "Username or email already exists" },
        { status: 409 }
      );
    }

    // 🔐 Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

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
 * PATCH: Update an admin's password securely by adminId
 */
export const PATCH = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { adminId, password } = body;

    if (!adminId || !password) {
      return NextResponse.json(
        { message: "adminId and password are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ message: "Invalid adminId" }, { status: 400 });
    }

    await connect();

    const hashedPassword = await bcrypt.hash(password, 10);

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
 * DELETE: Remove admin by ID
 */
export const DELETE = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");

    if (!adminId) {
      return NextResponse.json(
        { message: "adminId is required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ message: "Invalid adminId" }, { status: 400 });
    }

    await connect();

    const deletedAdmin = await Admin.findByIdAndDelete(adminId).select("-password");

    if (!deletedAdmin) {
      return NextResponse.json(
        { message: "Admin not found" },
        { status: 404 }
      );
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
