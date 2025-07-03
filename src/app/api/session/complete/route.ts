import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import { Types } from 'mongoose';

// POST - Request session completion
export async function POST(req: NextRequest) {
  await connect();
  try {
    const body = await req.json();
    const { sessionId, userId } = body;

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Session ID and User ID are required' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is part of the session
    const userIdObj = new Types.ObjectId(userId);
    if (!session.user1Id.equals(userIdObj) && !session.user2Id.equals(userIdObj)) {
      return NextResponse.json(
        { success: false, message: 'User not authorized for this session' },
        { status: 403 }
      );
    }

    // Check if session is active
    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Session must be active to request completion' },
        { status: 400 }
      );
    }

    // Check if completion already requested
    if (session.completionRequestedBy) {
      return NextResponse.json(
        { success: false, message: 'Session completion already requested' },
        { status: 400 }
      );
    }

    // Request completion
    session.completionRequestedBy = userIdObj;
    session.completionRequestedAt = new Date();
    await session.save();

    const populatedSession = await Session.findById(sessionId)
      .populate('user1Id', 'firstName lastName email')
      .populate('user2Id', 'firstName lastName email')
      .populate('completionRequestedBy', 'firstName lastName email');

    return NextResponse.json({
      success: true,
      message: 'Session completion requested successfully',
      session: populatedSession
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error requesting session completion:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Approve/Reject session completion
export async function PATCH(req: NextRequest) {
  await connect();
  try {
    const body = await req.json();
    const { sessionId, userId, action, rejectionReason } = body; // action: 'approve' or 'reject'

    if (!sessionId || !userId || !action) {
      return NextResponse.json(
        { success: false, message: 'Session ID, User ID, and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Check if rejection reason is provided when rejecting
    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Rejection reason is required when declining completion' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is part of the session
    const userIdObj = new Types.ObjectId(userId);
    if (!session.user1Id.equals(userIdObj) && !session.user2Id.equals(userIdObj)) {
      return NextResponse.json(
        { success: false, message: 'User not authorized for this session' },
        { status: 403 }
      );
    }

    // Check if completion was requested
    if (!session.completionRequestedBy) {
      return NextResponse.json(
        { success: false, message: 'No completion request found' },
        { status: 400 }
      );
    }

    // Check if user is not the one who requested completion
    if (session.completionRequestedBy.equals(userIdObj)) {
      return NextResponse.json(
        { success: false, message: 'Cannot approve your own completion request' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      session.completionApprovedBy = userIdObj;
      session.completionApprovedAt = new Date();
      session.status = 'completed';
    } else {
      // Reject - record rejection details and clear completion request
      session.completionRejectedBy = userIdObj;
      session.completionRejectedAt = new Date();
      session.completionRejectionReason = rejectionReason.trim();
      session.completionRequestedBy = undefined;
      session.completionRequestedAt = undefined;
    }

    await session.save();

    const populatedSession = await Session.findById(sessionId)
      .populate('user1Id', 'firstName lastName email')
      .populate('user2Id', 'firstName lastName email')
      .populate('completionRequestedBy', 'firstName lastName email')
      .populate('completionApprovedBy', 'firstName lastName email')
      .populate('completionRejectedBy', 'firstName lastName email');

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Session completed successfully' : 'Completion request declined',
      session: populatedSession
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error handling session completion:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
