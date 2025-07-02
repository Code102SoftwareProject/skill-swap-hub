import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import { Types } from 'mongoose';

// GET - Get progress by user ID
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

    const progress = await SessionProgress.find({ userId: new Types.ObjectId(userId) })
      .populate('sessionId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      progress
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update progress
export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  await connect();
  try {
    const { userId } = params;
    const body = await req.json();
    const { sessionId, completionPercentage, status, notes } = body;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const updateObj: any = {};
    if (completionPercentage !== undefined) updateObj.completionPercentage = completionPercentage;
    if (status) updateObj.status = status;
    if (notes !== undefined) updateObj.notes = notes;

    const progress = await SessionProgress.findOneAndUpdate(
      { 
        userId: new Types.ObjectId(userId),
        sessionId: new Types.ObjectId(sessionId)
      },
      updateObj,
      { new: true }
    )
      .populate('sessionId')
      .populate('userId', 'name email');

    if (!progress) {
      return NextResponse.json(
        { success: false, message: 'Progress not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      progress
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
