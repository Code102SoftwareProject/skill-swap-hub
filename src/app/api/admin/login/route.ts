import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "@/lib/models/adminSchema";
import connect from "@/lib/db";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
if (!ADMIN_JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET environment variable is not defined");
}

export const POST = async (req: NextRequest) => {
  try {
    const { username, password } = await req.json();
    console.log("Login attempt for:", username); // Debug log

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password required" },
        { status: 400 }
      );
    }

    await connect();

    const admin = await Admin.findOne({ username }); // Changed from email to username

    if (!admin) {
      console.log("Admin not found"); // Debug log
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log("Password doesn't match"); // Debug log
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: "admin",
      },
      ADMIN_JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Login successful, setting cookie"); // Debug log

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    // Set adminToken cookie
    response.cookies.set({
      name: "adminToken",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error); // Debug log
    return NextResponse.json(
      { message: "Login error", error: error.message },
      { status: 500 }
    );
  }
};
