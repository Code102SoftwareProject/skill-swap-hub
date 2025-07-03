import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import { Types } from 'mongoose';

// GET - Get all sessions
export async function GET(req: Request) {
  await connect();
  try {
    const sessions = await Session.find()
      .populate('user1Id', 'name email avatar')
      .populate('user2Id', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      sessions
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new session
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const {
      user1Id,
      skill1Id,
      descriptionOfService1,
      user2Id,
      skill2Id,
      descriptionOfService2,
      startDate
    } = body;

    // Validate required fields
    if (!user1Id || !skill1Id || !descriptionOfService1 || 
        !user2Id || !skill2Id || !descriptionOfService2 || !startDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await Session.create({
      user1Id: new Types.ObjectId(user1Id),
      skill1Id: new Types.ObjectId(skill1Id),
      descriptionOfService1,
      user2Id: new Types.ObjectId(user2Id),
      skill2Id: new Types.ObjectId(skill2Id),
      descriptionOfService2,
      startDate: new Date(startDate),
      isAccepted: null,
      isAmmended: false,
      status: 'pending'
    });

    const populatedSession = await Session.findById(session._id)
      .populate('user1Id', 'name email avatar')
      .populate('user2Id', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName');

    return NextResponse.json({
      success: true,
      message: "Session created successfully",
      session: populatedSession
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error creating session",
        error: error.message
      },
      { status: 500 }
    );
  }
}

// PUT - Update session (accept/reject)
export async function PUT(req: NextRequest) {
  try {
    await connect();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // accept or reject

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
      const progress1 = new SessionProgress({
        userId: session.user1Id,
        sessionId: session._id,
        status: "not_started",
        completionPercentage: 0,
        notes: ""
      });
      await progress1.save();

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
      // Handle rejection
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