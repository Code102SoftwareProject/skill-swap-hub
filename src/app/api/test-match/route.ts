import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import SkillMatch from "@/lib/models/skillMatch";

// Helper function to get user ID from token
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
 * POST endpoint to create a test match for badge testing
 * Body: { userTwoId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const userOneId = getUserIdFromToken(req);

    if (!userOneId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userTwoId } = await req.json();

    if (!userTwoId) {
      return NextResponse.json(
        { success: false, message: "userTwoId is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create a test match
    const testMatch = new SkillMatch({
      userOneId: userOneId,
      userTwoId: userTwoId,
      userOneDetails: {
        firstName: "TestUser",
        lastName: "One",
        avatar: "/default-avatar.png",
        offeringSkill: "JavaScript",
        seekingSkill: "Python",
      },
      userTwoDetails: {
        firstName: "TestUser",
        lastName: "Two",
        avatar: "/default-avatar.png",
        offeringSkill: "Python",
        seekingSkill: "JavaScript",
      },
      listingOneId: "test-listing-1",
      listingTwoId: "test-listing-2",
      matchPercentage: 100,
      matchType: "exact",
      status: "pending",
      createdAt: new Date(),
    });

    await testMatch.save();

    return NextResponse.json({
      success: true,
      message: "Test match created successfully",
      data: {
        matchId: testMatch._id,
        status: testMatch.status,
        userOneId: testMatch.userOneId,
        userTwoId: testMatch.userTwoId,
      },
    });
  } catch (error: any) {
    console.error("Error creating test match:", error);
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
