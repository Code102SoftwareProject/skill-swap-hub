import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/lib/models/userSchema";
import SuspendedUser from "@/lib/models/suspendedUserSchema";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export async function POST(req: Request) {
  const { email, password, rememberMe } = await req.json();

  // Validate inputs
  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required" },
      { status: 400 }
    );
  }

  try {
    // Connect to database
    await dbConnect();

    // Check if user is suspended
    const suspendedUser = await SuspendedUser.findOne({ email });

    if (suspendedUser) {
      return NextResponse.json(
        {
          success: false,
          suspended: true,
          message: `Your account has been suspended due to: ${suspendedUser.suspensionReason}. Please contact support for more information.`,
          suspensionDetails: {
            reason: suspendedUser.suspensionReason,
            suspendedAt: suspendedUser.suspendedAt,
            notes:
              suspendedUser.suspensionNotes || "No additional notes provided.",
          },
        },
        { status: 403 }
      );
    }

    // Find user by email
    console.log(`Looking for user with email: ${email}`);
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    console.log("User found, verifying password...");
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT token with appropriate expiry based on Remember Me
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: rememberMe ? "30d" : "24h" }
    );

    // Log for debugging
    console.log(
      `🔐 Token generated: ${rememberMe ? "Remember Me (30 days)" : "Normal login (24 hours)"}`
    );
    console.log("🕐 Current time:", new Date().toLocaleTimeString());
    console.log(
      "⏰ Token will expire at:",
      new Date(
        Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
      ).toLocaleString()
    );

    // Return success response with token and user info
    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: user,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
