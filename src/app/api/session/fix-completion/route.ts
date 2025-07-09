import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionCompletion from '@/lib/models/sessionCompletionSchema';

// POST - Fix sessions that have approved completion requests but aren't marked as completed
export async function POST(req: NextRequest) {
  try {
    await connect();
    
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
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

    // Check if there are any approved completion requests for this session
    const approvedRequests = await SessionCompletion.find({
      sessionId: new Types.ObjectId(sessionId),
      status: 'approved'
    });

    if (approvedRequests.length === 0) {
      return NextResponse.json(
        { success: false, message: "No approved completion requests found for this session" },
        { status: 400 }
      );
    }

    // Update session status to completed
    const oldStatus = session.status;
    session.status = 'completed';
    await session.save();

    return NextResponse.json({
      success: true,
      message: `Session status updated from '${oldStatus}' to 'completed'`,
      session: {
        id: session._id,
        oldStatus,
        newStatus: session.status,
        approvedRequestsCount: approvedRequests.length
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Fix completion error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Check sessions that need completion status fix
export async function GET(req: NextRequest) {
  try {
    await connect();
    
    // Find all sessions that have approved completion requests but aren't marked as completed
    const approvedRequests = await SessionCompletion.find({
      status: 'approved'
    }).select('sessionId');

    const sessionIds = approvedRequests.map(req => req.sessionId);

    const sessionsNeedingFix = await Session.find({
      _id: { $in: sessionIds },
      status: { $ne: 'completed' }
    }).populate('user1Id', 'firstName lastName email')
      .populate('user2Id', 'firstName lastName email');

    return NextResponse.json({
      success: true,
      sessionsNeedingFix: sessionsNeedingFix.map(session => ({
        id: session._id,
        status: session.status,
        user1: `${session.user1Id.firstName} ${session.user1Id.lastName}`,
        user2: `${session.user2Id.firstName} ${session.user2Id.lastName}`,
        createdAt: session.createdAt
      })),
      count: sessionsNeedingFix.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Check completion fix error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
