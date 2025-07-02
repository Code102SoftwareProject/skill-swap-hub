import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import { Types } from 'mongoose';

// GET - Get all sessions
export async function GET(req: Request) {
  await connect();
  try {
    const sessions = await Session.find()
      .populate('user1Id', 'name email avatar')
      .populate('user2Id', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      sessions
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new session
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const {
      user1Id,
      skill1Id,
      descriptionOfService1,
      user2Id,
      skill2Id,
      descriptionOfService2,
      startDate
    } = body;

    // Validate required fields
    if (!user1Id || !skill1Id || !descriptionOfService1 || 
        !user2Id || !skill2Id || !descriptionOfService2 || !startDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await Session.create({
      user1Id: new Types.ObjectId(user1Id),
      skill1Id: new Types.ObjectId(skill1Id),
      descriptionOfService1,
      user2Id: new Types.ObjectId(user2Id),
      skill2Id: new Types.ObjectId(skill2Id),
      descriptionOfService2,
      startDate: new Date(startDate),
      isAccepted: null,
      status: 'active'
    });

    const populatedSession = await Session.findById(session._id)
      .populate('user1Id', 'name email avatar')
      .populate('user2Id', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName');

    return NextResponse.json({
      success: true,
      session: populatedSession
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}