import { NextResponse, NextRequest } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionCancel from '@/lib/models/sessionCancelSchema';
import User from '@/lib/models/userSchema';
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import { Types } from 'mongoose';
import { validateAndExtractUserId } from '@/utils/jwtAuth';

// POST - Request session cancellation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    const authenticatedUserId = authResult.userId!;

    const { id: sessionId } = await params;
    const { initiatorId, reason, description, evidenceFiles = [] } = await req.json();

    // Verify that the authenticated user matches the initiatorId
    if (authenticatedUserId !== initiatorId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: You can only cancel sessions as yourself' },
        { status: 403 }
      );
    }

    if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(initiatorId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID or user ID format' },
        { status: 400 }
      );
    }

    if (!reason || !description) {
      return NextResponse.json(
        { success: false, message: 'Reason and description are required' },
        { status: 400 }
      );
    }

    // Check if session exists and is active
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Can only cancel active sessions' },
        { status: 400 }
      );
    }

    // Check if user is part of this session
    const userIsParticipant = session.user1Id.toString() === initiatorId || 
                             session.user2Id.toString() === initiatorId;
    if (!userIsParticipant) {
      return NextResponse.json(
        { success: false, message: 'User is not a participant in this session' },
        { status: 403 }
      );
    }

    // Check if there's already a pending cancellation request
    const existingRequest = await SessionCancel.findOne({
      sessionId,
      resolution: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: 'There is already a pending cancellation request for this session' },
        { status: 400 }
      );
    }

    // Create cancellation request
    const cancelRequest = new SessionCancel({
      sessionId,
      initiatorId,
      reason,
      description,
      evidenceFiles,
      responseStatus: 'pending',
      resolution: 'pending'
    });

    await cancelRequest.save();

    // Don't update session status immediately - only when agreed/finalized
    // session.status = 'canceled';
    // await session.save();

    // Populate the request with user details
    const populatedRequest = await SessionCancel.findById(cancelRequest._id)
      .populate('initiatorId', 'firstName lastName email')
      .populate('sessionId', 'user1Id user2Id');

    return NextResponse.json({
      success: true,
      message: 'Cancellation request submitted successfully',
      cancelRequest: populatedRequest,
      sessionUpdated: false // Changed to false since we're not updating session status immediately
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/session/[id]/cancel:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Get cancellation status/request for a session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    const { id: sessionId } = await params;

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const cancelRequest = await SessionCancel.findOne({ sessionId })
      .populate('initiatorId', 'firstName lastName email')
      .sort({ createdAt: -1 }); // Get the most recent one

    return NextResponse.json({
      success: true,
      cancelRequest
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/session/[id]/cancel:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Respond to cancellation request (agree/dispute)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    const { id: sessionId } = await params;
    const { 
      responderId, 
      action, // 'agree' or 'dispute'
      responseDescription,
      responseEvidenceFiles = [],
      workCompletionPercentage,
      finalNote // For final resolution after dispute
    } = await req.json();

    if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(responderId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID or user ID format' },
        { status: 400 }
      );
    }

    if (!['agree', 'dispute', 'finalize'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be agree, dispute, or finalize' },
        { status: 400 }
      );
    }

    // Find the pending cancellation request
    const cancelRequest = await SessionCancel.findOne({
      sessionId,
      resolution: 'pending'
    });

    if (!cancelRequest) {
      return NextResponse.json(
        { success: false, message: 'No pending cancellation request found' },
        { status: 404 }
      );
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('Found session:', sessionId, 'with current status:', session.status);

    // Verify user is the other participant (not the initiator)
    const otherUserId = session.user1Id.toString() === cancelRequest.initiatorId.toString() 
      ? session.user2Id.toString() 
      : session.user1Id.toString();

    if (otherUserId !== responderId) {
      return NextResponse.json(
        { success: false, message: 'User is not authorized to respond to this cancellation request' },
        { status: 403 }
      );
    }

    if (action === 'finalize') {
      // This is the final note from initiator after dispute
      if (cancelRequest.initiatorId.toString() !== responderId) {
        return NextResponse.json(
          { success: false, message: 'Only the initiator can finalize the cancellation' },
          { status: 403 }
        );
      }

      cancelRequest.finalNote = finalNote;
      cancelRequest.resolution = 'canceled';
      cancelRequest.resolvedDate = new Date();

      // Update session status to canceled
      console.log('Finalizing cancellation - setting session status to canceled for session:', sessionId);
      session.status = 'canceled';
      try {
        const savedSession = await session.save();
        console.log('Session finalized successfully:', savedSession.status);
        
        // Invalidate cache for both users
        const user1Id = session.user1Id.toString();
        const user2Id = session.user2Id.toString();
        invalidateUsersCaches(user1Id, user2Id);
      } catch (sessionSaveError) {
        console.error('Error saving session during finalization:', sessionSaveError);
        throw sessionSaveError;
      }

    } else if (action === 'agree') {
      // Other user agrees to cancellation
      cancelRequest.responseStatus = 'agreed';
      cancelRequest.responseDate = new Date();
      cancelRequest.responseDescription = responseDescription;
      cancelRequest.responseEvidenceFiles = responseEvidenceFiles;
      cancelRequest.workCompletionPercentage = workCompletionPercentage;
      cancelRequest.resolution = 'canceled';
      cancelRequest.resolvedDate = new Date();

      // Update session status to canceled
      console.log('Setting session status to canceled for session:', sessionId);
      session.status = 'canceled';
      try {
        const savedSession = await session.save();
        console.log('Session updated successfully:', savedSession.status);
        
        // Invalidate cache for both users
        const user1Id = session.user1Id.toString();
        const user2Id = session.user2Id.toString();
        invalidateUsersCaches(user1Id, user2Id);
      } catch (sessionSaveError) {
        console.error('Error saving session:', sessionSaveError);
        throw sessionSaveError;
      }

    } else if (action === 'dispute') {
      // Other user disputes the cancellation
      cancelRequest.responseStatus = 'disputed';
      cancelRequest.responseDate = new Date();
      cancelRequest.responseDescription = responseDescription;
      cancelRequest.responseEvidenceFiles = responseEvidenceFiles;
      cancelRequest.workCompletionPercentage = workCompletionPercentage;
      // Keep resolution as 'pending' for now, waiting for initiator's final decision
    }

    await cancelRequest.save();
    console.log('CancelRequest saved with resolution:', cancelRequest.resolution, 'and responseStatus:', cancelRequest.responseStatus);

    // Populate the updated request
    const populatedRequest = await SessionCancel.findById(cancelRequest._id)
      .populate('initiatorId', 'firstName lastName email')
      .populate('sessionId', 'user1Id user2Id');

    return NextResponse.json({
      success: true,
      message: `Cancellation request ${action === 'agree' ? 'accepted' : action === 'dispute' ? 'disputed' : 'finalized'} successfully`,
      cancelRequest: populatedRequest,
      sessionUpdated: action === 'agree' || action === 'finalize'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in PATCH /api/session/[id]/cancel:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
