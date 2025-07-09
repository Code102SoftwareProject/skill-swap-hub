import { NextRequest, NextResponse } from "next/server";
import {
  checkAndAssignFirstExchangeBadge,
  assignBadgeToUser,
  userHasBadge,
  checkAndAssignAllBadges,
} from "@/services/badgeAssignmentService";
import connect from "@/lib/db";
import User from "@/lib/models/userSchema";
import Badge from "@/lib/models/badgeSchema";

/**
 * POST endpoint to assign a badge to a user
 * Body: { userId: string, badgeName: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, badgeName } = body;

    if (!userId || !badgeName) {
      return NextResponse.json(
        { success: false, message: "userId and badgeName are required" },
        { status: 400 }
      );
    }

    const success = await assignBadgeToUser(userId, badgeName);

    if (success) {
      return NextResponse.json(
        {
          success: true,
          message: `Badge "${badgeName}" assigned successfully`,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to assign badge "${badgeName}" or user already has it`,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error in badge assignment API:", error);
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

/**
 * PATCH endpoint to check and assign all badges
 * Body: { userId: string, specificBadge?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, specificBadge } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    if (specificBadge) {
      // Check specific badge only
      let success = false;
      let message = "";

      switch (specificBadge) {
        case "First Exchange":
          success = await checkAndAssignFirstExchangeBadge(userId);
          message = success
            ? "First Exchange badge assigned successfully"
            : "User does not qualify for First Exchange badge or already has it";
          break;
        default:
          return NextResponse.json(
            { success: false, message: `Unknown badge type: ${specificBadge}` },
            { status: 400 }
          );
      }

      return NextResponse.json(
        {
          success: true,
          badgeAssigned: success,
          message,
        },
        { status: 200 }
      );
    } else {
      // Check and assign all possible badges
      const assignedBadges = await checkAndAssignAllBadges(userId);

      return NextResponse.json(
        {
          success: true,
          assignedBadges,
          badgeCount: assignedBadges.length,
          message:
            assignedBadges.length > 0
              ? `Assigned ${assignedBadges.length} new badges: ${assignedBadges.join(", ")}`
              : "No new badges assigned - user may already have qualifying badges or does not meet criteria",
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error in badge check API:", error);
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

/**
 * GET endpoint to get user's badges
 * Query: ?userId=string
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId is required" },
        { status: 400 }
      );
    }

    await connect();

    // Find user with populated badges
    const user = await User.findById(userId).populate("badges");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        badges: user.badges || [],
        badgeCount: user.badges ? user.badges.length : 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user badges:", error);
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
