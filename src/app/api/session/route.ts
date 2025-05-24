import { NextRequest, NextResponse } from "next/server";
import Session from "@/lib/models/sessionSchema";
import connect from "@/lib/db";
import mongoose from "mongoose";

async function POST(req: Request) {
  try {
    await connect();
    const body = await req.json();
    const { user1Id, skill1Id, descriptionOfService1, user2Id, skill2Id, descriptionOfService2, startDate } = body;
    const session = new Session({
      user1Id,
      skill1Id,
      descriptionOfService1,
      user2Id,
      skill2Id,
      descriptionOfService2,
      startDate,
      isAccepted: null,
      isAmmended: false,
      status: "pending",
    });
    const savedSession = await session.save();
    return NextResponse.json(
      {
        success: true,
        message: "Session created successfully",
        session: savedSession,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error creating session",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connect();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // New parameter: accept or reject

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!action || (action !== "accept" && action !== "reject")) {
      return NextResponse.json(
        { success: false, message: "Valid action (accept or reject) is required" },
        { status: 400 }
      );
    }

    // Find the session
    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    // Process based on action parameter
    if (action === "accept") {
      // Handle acceptance
      session.isAccepted = true;
      session.status = "active";

      // Create progress documents for both users
      const SessionProgress = mongoose.model("SessionProgress");

      // Create progress for user1
      const progress1 = new SessionProgress({
        userId: session.user1Id,
        sessionId: session._id,
        status: "not_started",
        completionPercentage: 0,
        notes: ""
      });
      await progress1.save();

      // Create progress for user2
      const progress2 = new SessionProgress({
        userId: session.user2Id,
        sessionId: session._id,
        status: "not_started",
        completionPercentage: 0,
        notes: ""
      });
      await progress2.save();

      // Link progress documents to session
      session.progress1 = progress1._id;
      session.progress2 = progress2._id;
    } else {
      // Handle rejection - just update status without creating progress
      session.isAccepted = false;
      session.status = "canceled";
    }

    // Save updated session
    await session.save();

    return NextResponse.json(
      {
        success: true,
        message: action === "accept" ? "Session accepted successfully" : "Session rejected",
        session,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error updating session",
        error: error.message,
      },
      { status: 500 }
    );
  }
}