import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionCompletion from '@/lib/models/sessionCompletionSchema';
import User from '@/lib/models/userSchema';
import { validateAndExtractUserId } from '@/utils/jwtAuth';
import { Types } from 'mongoose';

// POST - Request session completion
export async function POST(req: NextRequest) {
  try {
    await connect();
    
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        message: authResult.error
      }, { status: 401 });
    }
    
    const authenticatedUserId = authResult.userId!;
    
    const body = await req.json();
    const { sessionId, userId, requestForUser = 'both' } = body;

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, message: "Session ID and User ID are required" },
        { status: 400 }
      );
    }

    // Validate that the authenticated user matches the userId in the request
    if (userId !== authenticatedUserId) {
      return NextResponse.json({
        success: false,
        message: "Forbidden: Cannot request completion for other users"
      }, { status: 403 });
    }

    if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
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

    // Check if there's already a pending completion request from this user
    const existingRequest = await SessionCompletion.findOne({
      sessionId: new Types.ObjectId(sessionId),
      requestedBy: new Types.ObjectId(userId),
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: "You already have a pending completion request for this session" },
        { status: 400 }
      );
    }

    // Create new completion request
    const completionRequest = await SessionCompletion.create({
      sessionId: new Types.ObjectId(sessionId),
      requestedBy: new Types.ObjectId(userId),
      requestForUser,
      status: 'pending'
    });

    // Note: No longer updating session with completion request fields
    // All completion data is now tracked in SessionCompletion schema

    // Populate the created request
    const populatedRequest = await SessionCompletion.findById(completionRequest._id)
      .populate('requestedBy', 'firstName lastName email');

    return NextResponse.json({
      success: true,
      message: "Session completion requested successfully",
      completionRequest: populatedRequest
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session completion request error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject session completion 
export async function PATCH(req: NextRequest) {
  try {
    await connect();
    
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        message: authResult.error
      }, { status: 401 });
    }
    
    const authenticatedUserId = authResult.userId!;
    
    const body = await req.json();
    const { sessionId, userId, action, rejectionReason } = body;

    if (!sessionId || !userId || !action) {
      return NextResponse.json(
        { success: false, message: "Session ID, User ID, and action are required" },
        { status: 400 }
      );
    }

    // Validate that the authenticated user matches the userId in the request
    if (userId !== authenticatedUserId) {
      return NextResponse.json({
        success: false,
        message: "Forbidden: Cannot respond to completion requests for other users"
      }, { status: 403 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
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

    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Check if user is part of the session
    if (!session.user1Id.equals(userIdObj) && !session.user2Id.equals(userIdObj)) {
      return NextResponse.json(
        { success: false, message: "User is not part of this session" },
        { status: 403 }
      );
    }

    // Find pending completion requests for this session (not from the responding user)
    const otherUserId = session.user1Id.equals(userIdObj) ? session.user2Id : session.user1Id;
    const pendingRequests = await SessionCompletion.find({
      sessionId: new Types.ObjectId(sessionId),
      requestedBy: otherUserId,
      status: 'pending'
    });

    if (pendingRequests.length === 0) {
      return NextResponse.json(
        { success: false, message: "No pending completion requests found" },
        { status: 404 }
      );
    }

    // Update all pending requests from the other user
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected'
    };

    if (action === 'approve') {
      updateData.approvedBy = userIdObj;
      updateData.approvedAt = new Date();
    } else {
      updateData.rejectedBy = userIdObj;
      updateData.rejectedAt = new Date();
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    }

    const updatedRequests = await SessionCompletion.updateMany(
      {
        sessionId: new Types.ObjectId(sessionId),
        requestedBy: otherUserId,
        status: 'pending'
      },
      updateData
    );

    // Update session based on action
    if (action === 'approve') {
      // Approve completion - mark session as completed
      const oldStatus = session.status;
      session.status = 'completed';
      console.log(`Updating session ${sessionId} status from '${oldStatus}' to 'completed'`);
      
      const savedSession = await session.save();
      console.log(`Session ${sessionId} saved with status: ${savedSession.status}`);
      
      // Verify the session was actually updated
      const verifySession = await Session.findById(sessionId);
      if (verifySession && verifySession.status !== 'completed') {
        console.error(`Failed to update session ${sessionId} status. Current status: ${verifySession.status}`);
        return NextResponse.json(
          { success: false, message: "Failed to update session status to completed" },
          { status: 500 }
        );
      }
      
      console.log(`Session ${sessionId} status verified as completed`);
    } else if (action === 'reject') {
      // Rejection is handled in SessionCompletion schema
      // No changes needed to session for rejection
    }

    const message = action === 'approve' 
      ? "Session completed successfully" 
      : "Session completion request rejected";

    return NextResponse.json({
      success: true,
      message,
      updatedCount: updatedRequests.modifiedCount
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session completion response error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Get completion requests for a session
export async function GET(req: NextRequest) {
  try {
    await connect();
    
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        message: authResult.error
      }, { status: 401 });
    }
    
    const authenticatedUserId = authResult.userId!;
    
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Validate that the authenticated user matches the userId if provided
    if (userId && userId !== authenticatedUserId) {
      return NextResponse.json({
        success: false,
        message: "Forbidden: Cannot access completion requests for other users"
      }, { status: 403 });
    }

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    let query: any = { sessionId: new Types.ObjectId(sessionId) };
    
    // If userId is provided, filter by requests from that user
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user ID format' },
          { status: 400 }
        );
      }
      query.requestedBy = new Types.ObjectId(userId);
    }

    const completionRequests = await SessionCompletion.find(query)
      .populate('requestedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('rejectedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      completionRequests
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching completion requests:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT - Maintain backward compatibility with existing PUT requests
export async function PUT(req: NextRequest) {
  // Redirect PUT requests to PATCH handler
  return await PATCH(req);
}
