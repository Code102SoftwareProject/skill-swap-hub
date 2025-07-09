import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionCompletion from '@/lib/models/sessionCompletionSchema';

// POST - Fix all sessions that have approved completion requests but aren't marked as completed
export async function POST(req: NextRequest) {
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
    });

    const fixResults = [];
    
    for (const session of sessionsNeedingFix) {
      const oldStatus = session.status;
      session.status = 'completed';
      await session.save();
      
      fixResults.push({
        sessionId: session._id,
        oldStatus,
        newStatus: 'completed'
      });
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixResults.length} sessions`,
      fixedSessions: fixResults
    }, { status: 200 });

  } catch (error: any) {
    console.error('Bulk fix completion error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Check how many sessions need fixing
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
      count: sessionsNeedingFix.length,
      sessions: sessionsNeedingFix.map(session => ({
        id: session._id,
        status: session.status,
        user1: session.user1Id ? `${session.user1Id.firstName} ${session.user1Id.lastName}` : 'Unknown',
        user2: session.user2Id ? `${session.user2Id.firstName} ${session.user2Id.lastName}` : 'Unknown',
        createdAt: session.createdAt
      }))
    }, { status: 200 });

  } catch (error: any) {
    console.error('Check bulk fix error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
