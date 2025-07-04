import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connect from "@/lib/db";
import Admin from "@/lib/models/adminSchema";
import bcrypt from "bcryptjs";

/**
 * Admin Authentication API Route
 * This file handles admin user authentication by validating credentials
 * and generating JWT tokens for authenticated sessions.
 */

// Ensure JWT_SECRET is available in production environment
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production");
}

// Define JWT secret key with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";

/**
 * POST handler for admin login
 * Validates admin credentials and issues a JWT token on successful authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body to extract credentials
    const body = await request.json();
    const { username, password } = body;

    console.log("Login attempt:", { username });

    // Validate required fields
    if (!username || !password) {
      console.log("Missing username or password");
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connect();

    // Search for admin user by username
    const admin = await Admin.findOne({ username: username.trim() });

    // Return error if admin not found
    if (!admin) {
      console.log("Admin not found");
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    // Return error if password is invalid
    if (!isPasswordValid) {
      console.log("Password invalid");
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Generate JWT token with admin information
    console.log("Credentials valid, generating token");
    const token = jwt.sign(
      {
        userId: admin._id,
        username: admin.username,
        role: admin.role || "admin", // Use the role from database
        permissions: admin.permissions || [],
      },
      JWT_SECRET,
      { expiresIn: "8h" } // Token expires in 8 hours
    );

    // Create success response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    // Set secure HTTP-only cookie with the token
    response.cookies.set({
      name: "adminToken",
      value: token,
      httpOnly: true, // Prevents JavaScript access to the cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // Restricts cross-site requests
      maxAge: 60 * 60 * 8, // 8 hours in seconds
      path: "/", // Available across the entire site
    });

    console.log("Login successful, token generated");
    return response;
  } catch (error) {
    // Handle unexpected errors
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
