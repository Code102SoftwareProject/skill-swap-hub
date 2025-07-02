import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import { Types } from 'mongoose';

// GET - Get all sessions for a specific user
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  await connect();
  try {
    const { userId } = params;

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const userObjectId = new Types.ObjectId(userId);
    const sessions = await Session.find({
      $or: [
        { user1Id: userObjectId },
        { user2Id: userObjectId }
      ]
    })
      .populate('user1Id', 'name email avatar')
      .populate('user2Id', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .populate('progress1')
      .populate('progress2')
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
