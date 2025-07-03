import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/userSchema";
import Badge from "@/lib/models/badgeSchema";
import {
  checkAndAssignFirstExchangeBadge,
  checkAndAssignAllBadges,
} from "@/services/badgeAssignmentService";

/**
 * Test badge assignment for a specific user
 * POST /api/admin/test-badges
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, testType } = await req.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "userId is required",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user before test
    const userBefore = await User.findById(userId).populate(
      "badges",
      "name description"
    );
    if (!userBefore) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const testResults = {
      userInfo: {
        name: `${userBefore.firstName} ${userBefore.lastName}`,
        id: userBefore._id,
      },
      before: {
        badgeCount: userBefore.badges?.length || 0,
        badges: userBefore.badges || [],
      },
      testPerformed: null as string | null,
      results: null as any,
      after: {
        badgeCount: 0,
        badges: [] as any[],
      },
    };

    // Perform the test based on testType
    switch (testType) {
      case "firstExchange":
        testResults.testPerformed = "First Exchange Badge Assignment";
        testResults.results = await checkAndAssignFirstExchangeBadge(userId);
        break;

      case "allBadges":
        testResults.testPerformed = "All Badges Check";
        testResults.results = await checkAndAssignAllBadges(userId);
        break;

      default:
        // Default to first exchange test
        testResults.testPerformed = "First Exchange Badge Assignment (default)";
        testResults.results = await checkAndAssignFirstExchangeBadge(userId);
    }

    // Get user after test
    const userAfter = await User.findById(userId).populate(
      "badges",
      "name description"
    );
    testResults.after = {
      badgeCount: userAfter?.badges?.length || 0,
      badges: userAfter?.badges || [],
    };

    return NextResponse.json({
      success: true,
      message: "Badge assignment test completed",
      data: testResults,
    });
  } catch (error) {
    console.error("❌ Badge test failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Badge assignment test failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to list users for testing
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get sample users for testing
    const users = await User.find({})
      .populate("badges", "name description")
      .select("firstName lastName email badges")
      .limit(10);

    const usersData = users.map((user) => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      badgeCount: user.badges?.length || 0,
      badges: user.badges || [],
    }));

    return NextResponse.json({
      success: true,
      message: "Available users for testing",
      data: {
        totalUsers: await User.countDocuments(),
        sampleUsers: usersData,
      },
    });
  } catch (error) {
    console.error("❌ Failed to get users for testing:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get users for testing",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
