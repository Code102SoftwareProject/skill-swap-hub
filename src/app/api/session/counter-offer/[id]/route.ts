import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import SessionCounterOffer from '@/lib/models/sessionCounterOfferSchema';
import Session from '@/lib/models/sessionSchema';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import { Types } from 'mongoose';

// PATCH - Accept or reject a counter offer
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, userId } = body; // action: 'accept' | 'reject'

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid counter offer ID format' },
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

    // Get the counter offer
    const counterOffer = await SessionCounterOffer.findById(id).populate('originalSessionId');
    if (!counterOffer) {
      return NextResponse.json(
        { success: false, message: 'Counter offer not found' },
        { status: 404 }
      );
    }

    // Get the original session
    const originalSession = counterOffer.originalSessionId as any;
    if (!originalSession) {
      return NextResponse.json(
        { success: false, message: 'Original session not found' },
        { status: 404 }
      );
    }

    // Verify that the user responding is the original session creator (user1)
    const userObjectId = new Types.ObjectId(userId);
    if (!originalSession.user1Id.equals(userObjectId)) {
      return NextResponse.json(
        { success: false, message: 'Only the original session creator can respond to counter offers' },
        { status: 403 }
      );
    }

    // Check if counter offer is still pending
    if (counterOffer.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `Counter offer is already ${counterOffer.status}` },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Update the original session with counter offer details
      await Session.findByIdAndUpdate(originalSession._id, {
        skill1Id: counterOffer.skill1Id,
        descriptionOfService1: counterOffer.descriptionOfService1,
        skill2Id: counterOffer.skill2Id,
        descriptionOfService2: counterOffer.descriptionOfService2,
        startDate: counterOffer.startDate,
        expectedEndDate: counterOffer.expectedEndDate,
        isAccepted: true,
        isAmmended: true,
        status: 'active'
      });

      // Create session progress for both users
      console.log('Creating progress records for counter offer acceptance:', {
        sessionId: originalSession._id,
        user1Id: originalSession.user1Id,
        user2Id: originalSession.user2Id,
        startDate: counterOffer.startDate
      });

      const dueDate = counterOffer.expectedEndDate ? new Date(counterOffer.expectedEndDate) : (() => {
        const defaultDue = new Date(counterOffer.startDate);
        defaultDue.setDate(defaultDue.getDate() + 30);
        return defaultDue;
      })();

      const progress1 = await SessionProgress.create({
        userId: originalSession.user1Id,
        sessionId: originalSession._id,
        startDate: counterOffer.startDate,
        dueDate: dueDate,
        completionPercentage: 0,
        status: 'not_started',
        notes: ''
      });

      console.log('Created progress1:', progress1._id);

      const progress2 = await SessionProgress.create({
        userId: originalSession.user2Id,
        sessionId: originalSession._id,
        startDate: counterOffer.startDate,
        dueDate: dueDate,
        completionPercentage: 0,
        status: 'not_started',
        notes: ''
      });

      console.log('Created progress2:', progress2._id);

      // Update session with progress references
      await Session.findByIdAndUpdate(originalSession._id, {
        progress1: progress1._id,
        progress2: progress2._id
      });

      console.log('Updated session with progress references');

    } else {
      // If rejected, just mark the original session as rejected
      await Session.findByIdAndUpdate(originalSession._id, {
        isAccepted: false,
        status: 'canceled'
      });
    }

    // Update counter offer status
    const updatedCounterOffer = await SessionCounterOffer.findByIdAndUpdate(
      id,
      { status: action === 'accept' ? 'accepted' : 'rejected' },
      { new: true }
    )
      .populate('originalSessionId')
      .populate('counterOfferedBy', 'firstName lastName email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName');

    return NextResponse.json({
      success: true,
      counterOffer: updatedCounterOffer,
      message: `Counter offer ${action}ed successfully`
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
