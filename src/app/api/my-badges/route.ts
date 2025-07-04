import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connect from "@/lib/db";
import User from "@/lib/models/userSchema";

// Helper function to get user ID from token
function getUserIdFromToken(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get("authorization");
    console.log("Auth header:", authHeader ? "EXISTS" : "MISSING");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Invalid auth header format");
      return null;
    }

    const token = authHeader.split(" ")[1];
    console.log("Token preview:", token.substring(0, 20) + "...");

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is missing!");
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    console.log("Decoded userId:", decoded.userId);
    return decoded.userId;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * GET endpoint to get current user's badges using their token
 * No userId parameter needed - uses token to identify user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connect();

    // Find user with populated badges
    const user = await User.findById(userId).populate(
      "badges",
      "name description imageUrl criteria isActive"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        badges: user.badges || [],
        badgeCount: user.badges ? user.badges.length : 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching current user badges:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
