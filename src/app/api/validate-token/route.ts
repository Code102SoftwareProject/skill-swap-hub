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
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "No token provided",
        },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      email: string;
    };

    // Connect to database
    await dbConnect();

    // First check if user is in suspended collection
    const suspendedUser = await SuspendedUser.findOne({
      $or: [{ originalUserId: decoded.userId }, { email: decoded.email }],
    });

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

    // Find user to ensure they still exist
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Token is valid
    return NextResponse.json({
      success: true,
      message: "Token is valid",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        title: user.title,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Token validation error:", error);

    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        {
          success: false,
          message: "Token expired",
        },
        { status: 401 }
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Token validation failed",
      },
      { status: 500 }
    );
  }
}
