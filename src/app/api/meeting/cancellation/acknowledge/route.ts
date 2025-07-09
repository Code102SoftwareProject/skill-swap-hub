import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import cancelMeetingSchema from '@/lib/models/cancelMeetingSchema';

export async function POST(request: NextRequest) {
  try {
    await connect();

    const { meetingId, userId } = await request.json();

    if (!meetingId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Meeting ID and User ID are required' },
        { status: 400 }
      );
    }

    // Find the cancellation record and mark it as acknowledged
    const cancellation = await cancelMeetingSchema.findOneAndUpdate(
      { meetingId },
      { 
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: userId
      },
      { new: true }
    );

    if (!cancellation) {
      return NextResponse.json(
        { success: false, message: 'Cancellation record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cancellation acknowledged successfully',
      cancellation
    });

  } catch (error) {
    console.error('Error acknowledging cancellation:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
