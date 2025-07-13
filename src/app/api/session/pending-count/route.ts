import { NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';

// GET - Get pending session count from user1 to user2
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const user1Id = searchParams.get('user1Id');
    const user2Id = searchParams.get('user2Id');

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { success: false, message: 'Both user1Id and user2Id are required' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(user1Id) || !Types.ObjectId.isValid(user2Id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Count pending sessions from user1 to user2
    const pendingCount = await Session.countDocuments({
      user1Id: new Types.ObjectId(user1Id),
      user2Id: new Types.ObjectId(user2Id),
      status: 'pending',
      isAccepted: null
    });

    return NextResponse.json({
      success: true,
      pendingCount,
      canCreateMore: pendingCount < 3,
      remainingRequests: Math.max(0, 3 - pendingCount)
    }, { status: 200 });

  } catch (error: any) {
    console.error('Pending session count API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
