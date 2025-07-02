import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import { Types } from 'mongoose';

// PATCH - Accept or reject a session and create progress if accepted
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  try {
    const { id } = params;
    const body = await req.json();
    const { action, userId } = body; // action: 'accept' | 'reject'

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

    // Update session based on action
    const updateObj: any = {
      isAccepted: action === 'accept',
      updatedAt: new Date()
    };

    // If rejected, set status to canceled
    if (action === 'reject') {
      updateObj.status = 'canceled';
    }

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      updateObj,
      { new: true }
    );

    // If accepted, create session progress for both users
    if (action === 'accept') {
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

      // Update session with progress references
      await Session.findByIdAndUpdate(id, {
        progress1: progress1._id,
        progress2: progress2._id
      });
    }

    // Get the final updated session with all populated data
    const finalSession = await Session.findById(id)
      .populate('user1Id', 'name email avatar')
      .populate('user2Id', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .populate('progress1')
      .populate('progress2');

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
