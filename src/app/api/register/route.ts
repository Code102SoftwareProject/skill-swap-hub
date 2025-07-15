import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/lib/models/userSchema";
import SuspendedUser from "@/lib/models/suspendedUserSchema";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export async function POST(req: Request) {
  try {
    const userData = await req.json();

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "title",
      "password",
    ];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return NextResponse.json(
          {
            success: false,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
          },
          { status: 400 }
        );
      }
    }

    // Connect to database
    await dbConnect();

    // Check if user is suspended
    const suspendedUser = await SuspendedUser.findOne({
      $or: [{ email: userData.email }, { phone: userData.phone }],
    });

    if (suspendedUser) {
      return NextResponse.json(
        {
          success: false,
          suspended: true,
          message: `Your account has been suspended due to: ${suspendedUser.suspensionReason}. You are not allowed to create a new account. Please contact support for more information.`,
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already in use",
        },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      title: userData.title,
      password: userData.password,
    });

    // Save the user to database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        name: `${newUser.firstName} ${newUser.lastName}`,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    // Return success with token and user info
    return NextResponse.json({
      success: true,
      message: "Registration successful",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during registration",
      },
      { status: 500 }
    );
  }
}
