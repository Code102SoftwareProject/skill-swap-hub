import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import User from '@/lib/models/userSchema';

// POST - Request session completion
export async function POST(req: NextRequest) {
  try {
    await connect();
    
    const body = await req.json();
    const { sessionId, userId } = body;

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, message: "Session ID and User ID are required" },
        { status: 400 }
      );
    }

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    // Check if session is active
    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, message: "Session must be active to request completion" },
        { status: 400 }
      );
    }

    // Check if user is part of the session
    const userIdObj = new mongoose.Types.ObjectId(userId);
    if (!session.user1Id.equals(userIdObj) && !session.user2Id.equals(userIdObj)) {
      return NextResponse.json(
        { success: false, message: "User is not part of this session" },
        { status: 403 }
      );
    }

    // Check if completion already requested
    if (session.completionRequestedBy) {
      return NextResponse.json(
        { success: false, message: "Session completion already requested" },
        { status: 400 }
      );
    }

    // Update session with completion request
    session.completionRequestedBy = userIdObj;
    session.completionRequestedAt = new Date();
    await session.save();

    // Populate session data to return
    const populatedSession = await Session.findById(sessionId)
      .populate('user1Id', 'firstName lastName email')
      .populate('user2Id', 'firstName lastName email')
      .populate('skill1Id', 'skillTitle')
      .populate('skill2Id', 'skillTitle');

    return NextResponse.json({
      success: true,
      message: "Session completion requested successfully",
      session: populatedSession
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session completion request error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Approve or reject session completion
export async function PUT(req: NextRequest) {
  try {
    await connect();
    
    const body = await req.json();
    const { sessionId, userId, action, rejectionReason } = body;

    if (!sessionId || !userId || !action) {
      return NextResponse.json(
        { success: false, message: "Session ID, User ID, and action are required" },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, message: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    // Check if completion was requested
    if (!session.completionRequestedBy) {
      return NextResponse.json(
        { success: false, message: "No completion request found for this session" },
        { status: 400 }
      );
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Check if user is the other person (not the one who requested)
    if (session.completionRequestedBy.equals(userIdObj)) {
      return NextResponse.json(
        { success: false, message: "You cannot approve your own completion request" },
        { status: 403 }
      );
    }

    // Check if user is part of the session
    if (!session.user1Id.equals(userIdObj) && !session.user2Id.equals(userIdObj)) {
      return NextResponse.json(
        { success: false, message: "User is not part of this session" },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // Approve completion
      session.completionApprovedBy = userIdObj;
      session.completionApprovedAt = new Date();
      session.status = 'completed';
      
      // Clear any previous rejection
      session.completionRejectedBy = undefined;
      session.completionRejectedAt = undefined;
      session.completionRejectionReason = undefined;
      
    } else if (action === 'reject') {
      // Reject completion
      session.completionRejectedBy = userIdObj;
      session.completionRejectedAt = new Date();
      session.completionRejectionReason = rejectionReason || "Completion request rejected";
      
      // Clear the completion request so it can be requested again
      session.completionRequestedBy = undefined;
      session.completionRequestedAt = undefined;
    }

    await session.save();

    // Populate session data to return
    const populatedSession = await Session.findById(sessionId)
      .populate('user1Id', 'firstName lastName email')
      .populate('user2Id', 'firstName lastName email')
      .populate('skill1Id', 'skillTitle')
      .populate('skill2Id', 'skillTitle');

    const message = action === 'approve' 
      ? "Session completed successfully" 
      : "Session completion request rejected";

    return NextResponse.json({
      success: true,
      message,
      session: populatedSession
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session completion approval error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
