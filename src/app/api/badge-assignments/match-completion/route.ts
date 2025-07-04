// File: src/app/api/badge-assignments/match-completion/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import {
  handleMatchCompletionBadges,
  getCompletedSkillSessionsCount,
  userHasBadge,
} from "@/services/badgeAssignmentService";

// Helper function to get user ID from the token
function getUserIdFromToken(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    return decoded.userId;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * POST endpoint to handle badge assignments after match completion
 * Body: { userOneId: string, userTwoId: string, matchId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const requestingUserId = getUserIdFromToken(request);

    if (!requestingUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { userOneId, userTwoId, matchId } = data;

    if (!userOneId || !userTwoId || !matchId) {
      return NextResponse.json(
        {
          success: false,
          message: "userOneId, userTwoId, and matchId are required",
        },
        { status: 400 }
      );
    }

    // Verify that the requesting user is one of the users in the match
    if (requestingUserId !== userOneId && requestingUserId !== userTwoId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You can only trigger badge assignments for your own matches",
        },
        { status: 403 }
      );
    }
    await dbConnect();

    try {
      // Use the dedicated service function for match completion badge assignments
      const result = await handleMatchCompletionBadges(
        userOneId,
        userTwoId,
        matchId
      );

      const totalAssigned =
        result.userOneAssigned.length + result.userTwoAssigned.length;

      return NextResponse.json({
        success: true,
        message: `Badge assignment completed for match ${matchId}`,
        data: {
          matchId,
          userOneAssigned: result.userOneAssigned,
          userTwoAssigned: result.userTwoAssigned,
          totalBadgesAssigned: totalAssigned,
        },
      });
    } catch (badgeError) {
      console.error("Error in badge assignment process:", badgeError);
      return NextResponse.json(
        {
          success: false,
          message: "Badge assignment process failed",
          error:
            badgeError instanceof Error ? badgeError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in badge assignment endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check badge eligibility without assigning
 * Query params: userOneId, userTwoId
 */
export async function GET(request: NextRequest) {
  try {
    const requestingUserId = getUserIdFromToken(request);

    if (!requestingUserId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userOneId = searchParams.get("userOneId");
    const userTwoId = searchParams.get("userTwoId");

    if (!userOneId || !userTwoId) {
      return NextResponse.json(
        {
          success: false,
          message: "userOneId and userTwoId are required",
        },
        { status: 400 }
      );
    }

    // Verify that the requesting user is one of the users
    if (requestingUserId !== userOneId && requestingUserId !== userTwoId) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only check badge eligibility for your own matches",
        },
        { status: 403 }
      );
    }
    await dbConnect();

    try {
      // Check eligibility for both users
      const [userOneSessionCount, userTwoSessionCount] = await Promise.all([
        getCompletedSkillSessionsCount(userOneId),
        getCompletedSkillSessionsCount(userTwoId),
      ]);

      const [userOneHasFirstBadge, userTwoHasFirstBadge] = await Promise.all([
        userHasBadge(userOneId, "First Exchange"),
        userHasBadge(userTwoId, "First Exchange"),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          userOne: {
            userId: userOneId,
            completedSessions: userOneSessionCount,
            hasFirstExchangeBadge: userOneHasFirstBadge,
            eligibleForFirstExchange:
              userOneSessionCount === 1 && !userOneHasFirstBadge,
          },
          userTwo: {
            userId: userTwoId,
            completedSessions: userTwoSessionCount,
            hasFirstExchangeBadge: userTwoHasFirstBadge,
            eligibleForFirstExchange:
              userTwoSessionCount === 1 && !userTwoHasFirstBadge,
          },
        },
      });
    } catch (error) {
      console.error("Error checking badge eligibility:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to check badge eligibility",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in badge eligibility check endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
