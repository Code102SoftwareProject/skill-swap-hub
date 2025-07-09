// File: src/app/api/matches/[id]/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import SkillMatch from "@/lib/models/skillMatch";
import mongoose from "mongoose";

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

// Helper function to extract match ID from URL
function getMatchIdFromUrl(request: NextRequest): string {
  const url = request.url;
  const pathParts = url.split("/");
  const id = pathParts[pathParts.length - 1];

  // Handle trailing slash if present
  return id === "" ? pathParts[pathParts.length - 2] : id;
}

// GET - Fetch a specific match
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const matchId = getMatchIdFromUrl(request);

    // Validate ID
    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid match ID",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the match
    const match = await SkillMatch.findById(matchId);

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          message: "Match not found",
        },
        { status: 404 }
      );
    }

    // Verify that the user is part of this match
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view this match",
        },
        { status: 403 }
      );
    }

    // Transform match to identify the current user's perspective
    const isUserOne = match.userOneId === userId;
    const transformedMatch = {
      id: match.id,
      matchPercentage: match.matchPercentage,
      matchType: match.matchType,
      status: match.status,
      createdAt: match.createdAt,
      // Current user's data
      myDetails: isUserOne ? match.userOneDetails : match.userTwoDetails,
      myListingId: isUserOne ? match.listingOneId : match.listingTwoId,
      // Other user's data
      otherUser: {
        userId: isUserOne ? match.userTwoId : match.userOneId,
        listingId: isUserOne ? match.listingTwoId : match.listingOneId,
        firstName: isUserOne
          ? match.userTwoDetails.firstName
          : match.userOneDetails.firstName,
        lastName: isUserOne
          ? match.userTwoDetails.lastName
          : match.userOneDetails.lastName,
        avatar: isUserOne
          ? match.userTwoDetails.avatar
          : match.userOneDetails.avatar,
        offeringSkill: isUserOne
          ? match.userTwoDetails.offeringSkill
          : match.userOneDetails.offeringSkill,
        seekingSkill: isUserOne
          ? match.userTwoDetails.seekingSkill
          : match.userOneDetails.seekingSkill,
      },
    };

    return NextResponse.json({
      success: true,
      data: transformedMatch,
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch match",
      },
      { status: 500 }
    );
  }
}

// PUT - Update match status
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const matchId = getMatchIdFromUrl(request);

    // Validate ID
    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid match ID",
        },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Validate status
    if (
      !data.status ||
      !["accepted", "rejected", "completed"].includes(data.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status value",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the match
    const match = await SkillMatch.findById(matchId);

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          message: "Match not found",
        },
        { status: 404 }
      );
    }

    // Verify that the user is part of this match
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to update this match",
        },
        { status: 403 }
      );
    }

    // Update the match status
    match.status = data.status;
    await match.save();

    // If match is being marked as completed, trigger badge assignment
    if (data.status === "completed") {
      try {
        console.log("🎯 BADGE ASSIGNMENT TRIGGERED - Match completed");
        console.log(`Match ID: ${match._id.toString()}`);
        console.log(`User 1: ${match.userOneId}`);
        console.log(`User 2: ${match.userTwoId}`);

        // Import and call the badge assignment service directly
        const { handleMatchCompletionBadges } = await import(
          "@/services/badgeAssignmentService"
        );

        const badgeResults = await handleMatchCompletionBadges(
          match.userOneId,
          match.userTwoId,
          match._id.toString()
        );

        console.log("🏆 BADGE ASSIGNMENT RESULTS:", badgeResults);
        console.log(
          `Checked badge eligibility for match completion: users ${match.userOneId} and ${match.userTwoId}`
        );
      } catch (badgeError) {
        // Don't fail the match completion if badge assignment fails
        console.error("❌ Error in badge assignment:", badgeError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Match status updated to ${data.status}`,
      data: match,
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update match",
      },
      { status: 500 }
    );
  }
}
