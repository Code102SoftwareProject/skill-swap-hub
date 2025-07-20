import { NextResponse, NextRequest } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import { Types } from 'mongoose';
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import { validateAndExtractUserId } from '@/utils/jwtAuth';

// PATCH - Accept or reject a session and create progress if accepted
export async function PATCH(
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

    const { id } = await params;
    const body = await req.json();
    const { action, userId } = body; // action: 'accept' | 'reject'

    // Verify that the authenticated user matches the userId
    if (authenticatedUserId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: You can only accept/reject sessions as yourself' },
        { status: 403 }
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Valid user ID is required' },
        { status: 400 }
      );
    }

    // Get the session
    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('Session accept/reject attempt:', {
      sessionId: id,
      currentStatus: session.status,
      isAccepted: session.isAccepted,
      action,
      userId
    });

    // Verify that the user is part of this session
    const userObjectId = new Types.ObjectId(userId);
    const isUser1 = session.user1Id.equals(userObjectId);
    const isUser2 = session.user2Id.equals(userObjectId);

    if (!isUser1 && !isUser2) {
      return NextResponse.json(
        { success: false, message: 'User is not part of this session' },
        { status: 403 }
      );
    }

    // Check if session is already accepted or rejected
    if (session.isAccepted !== null) {
      return NextResponse.json(
        { success: false, message: `Session is already ${session.isAccepted ? 'accepted' : 'rejected'}` },
        { status: 400 }
      );
    }

    // Check if session is canceled - cannot accept/reject canceled sessions
    if (session.status === 'canceled') {
      return NextResponse.json(
        { success: false, message: 'Cannot accept or reject a canceled session' },
        { status: 400 }
      );
    }

    // Check if session is completed - cannot accept/reject completed sessions
    if (session.status === 'completed') {
      return NextResponse.json(
        { success: false, message: 'Cannot accept or reject a completed session' },
        { status: 400 }
      );
    }

    // Update session based on action
    const updateObj: any = {
      isAccepted: action === 'accept',
      updatedAt: new Date()
    };

    // If accepted, set status to active; if rejected, set status to rejected and track who rejected
    if (action === 'accept') {
      updateObj.status = 'active';
    } else if (action === 'reject') {
      updateObj.status = 'rejected';
      updateObj.rejectedBy = userObjectId;
      updateObj.rejectedAt = new Date();
    }

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      updateObj,
      { new: true }
    );

    // If accepted, create session progress for both users
    if (action === 'accept') {
      console.log('Creating progress records for session acceptance:', {
        sessionId: session._id,
        user1Id: session.user1Id,
        user2Id: session.user2Id,
        startDate: session.startDate
      });

      // Calculate due date (30 days from start date)
      const dueDate = new Date(session.startDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Create progress for user1
      const progress1 = await SessionProgress.create({
        userId: session.user1Id,
        sessionId: session._id,
        startDate: session.startDate,
        dueDate: dueDate,
        completionPercentage: 0,
        status: 'not_started',
        notes: ''
      });

      console.log('Created progress1:', progress1._id);

      // Create progress for user2
      const progress2 = await SessionProgress.create({
        userId: session.user2Id,
        sessionId: session._id,
        startDate: session.startDate,
        dueDate: dueDate,
        completionPercentage: 0,
        status: 'not_started',
        notes: ''
      });

      console.log('Created progress2:', progress2._id);

      // Update session with progress references
      await Session.findByIdAndUpdate(id, {
        progress1: progress1._id,
        progress2: progress2._id
      });

      console.log('Updated session with progress references');
    }

    // Get the final updated session with all populated data
    const finalSession = await Session.findById(id)
      .populate('user1Id', 'firstName lastName email avatar')
      .populate('user2Id', 'firstName lastName email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .populate('progress1')
      .populate('progress2')
      .populate('rejectedBy', 'firstName lastName email avatar');

    // Invalidate cache for both users
    const user1Id = finalSession.user1Id._id.toString();
    const user2Id = finalSession.user2Id._id.toString();
    invalidateUsersCaches(user1Id, user2Id);
    console.log('Cache invalidated for users after session accept/reject:', {
      user1Id,
      user2Id,
      action,
      sessionId: id
    });

    return NextResponse.json({
      success: true,
      session: finalSession,
      message: `Session ${action}ed successfully`
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
