import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import { Types } from 'mongoose';

// GET - Get session progress for a specific session
export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  await connect();
  try {
    const { sessionId } = await params;

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const progress = await SessionProgress.find({ sessionId: new Types.ObjectId(sessionId) })
      .populate('userId', 'firstName lastName email avatar')
      .populate('sessionId')
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

// PATCH - Update session progress
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  await connect();
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { userId, completionPercentage, status, notes } = body;

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['not_started', 'in_progress', 'completed', 'abandoned'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Validate completion percentage if provided
    if (completionPercentage !== undefined && (completionPercentage < 0 || completionPercentage > 100)) {
      return NextResponse.json(
        { success: false, message: 'Completion percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (completionPercentage !== undefined) updateData.completionPercentage = completionPercentage;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const progress = await SessionProgress.findOneAndUpdate(
      { 
        sessionId: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId)
      },
      updateData,
      { 
        new: true, 
        runValidators: true,
        upsert: true // Create if doesn't exist
      }
    )
      .populate('userId', 'firstName lastName email avatar')
      .populate('sessionId');

    if (!progress) {
      return NextResponse.json(
        { success: false, message: 'Session progress not found' },
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
