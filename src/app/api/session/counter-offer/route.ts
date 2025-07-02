import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import SessionCounterOffer from '@/lib/models/sessionCounterOfferSchema';
import Session from '@/lib/models/sessionSchema';
import { Types } from 'mongoose';

// POST - Create a counter offer
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const {
      originalSessionId,
      counterOfferedBy,
      skill1Id,
      descriptionOfService1,
      skill2Id,
      descriptionOfService2,
      startDate,
      counterOfferMessage
    } = body;

    // Validate required fields
    if (!originalSessionId || !counterOfferedBy || !skill1Id || !descriptionOfService1 || 
        !skill2Id || !descriptionOfService2 || !startDate || !counterOfferMessage) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that the session exists
    const originalSession = await Session.findById(originalSessionId);
    if (!originalSession) {
      return NextResponse.json(
        { success: false, message: 'Original session not found' },
        { status: 404 }
      );
    }

    // Validate that the user making counter offer is part of the session
    const counterOffererId = new Types.ObjectId(counterOfferedBy);
    if (!originalSession.user1Id.equals(counterOffererId) && !originalSession.user2Id.equals(counterOffererId)) {
      return NextResponse.json(
        { success: false, message: 'User is not part of this session' },
        { status: 403 }
      );
    }

    // Check if session is still pending
    if (originalSession.isAccepted !== null) {
      return NextResponse.json(
        { success: false, message: 'Cannot create counter offer for a session that has already been responded to' },
        { status: 400 }
      );
    }

    const counterOffer = await SessionCounterOffer.create({
      originalSessionId: new Types.ObjectId(originalSessionId),
      counterOfferedBy: counterOffererId,
      skill1Id: new Types.ObjectId(skill1Id),
      descriptionOfService1,
      skill2Id: new Types.ObjectId(skill2Id),
      descriptionOfService2,
      startDate: new Date(startDate),
      counterOfferMessage,
      status: 'pending'
    });

    // Mark original session as amended
    await Session.findByIdAndUpdate(originalSessionId, { isAmmended: true });

    const populatedCounterOffer = await SessionCounterOffer.findById(counterOffer._id)
      .populate('originalSessionId')
      .populate('counterOfferedBy', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName');

    return NextResponse.json({
      success: true,
      counterOffer: populatedCounterOffer
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Get counter offers for a session
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    const counterOffers = await SessionCounterOffer.find({ originalSessionId: sessionId })
      .populate('originalSessionId')
      .populate('counterOfferedBy', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      counterOffers
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
