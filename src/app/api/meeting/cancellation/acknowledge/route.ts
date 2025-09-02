import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import cancelMeetingSchema from '@/lib/models/cancelMeetingSchema';
import { validateAndExtractUserId } from '@/utils/jwtAuth';

export async function POST(request: NextRequest) {
  try {
    await connect();

    // Validate authentication
    const userId = await validateAndExtractUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { meetingId, userId: requestUserId } = await request.json();

    if (!meetingId || !requestUserId) {
      return NextResponse.json(
        { success: false, message: 'Meeting ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify the user can only acknowledge for themselves
    if (requestUserId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Cannot acknowledge cancellation for another user' },
        { status: 403 }
      );
    }

    // Find the cancellation record and mark it as acknowledged
    const cancellation = await cancelMeetingSchema.findOneAndUpdate(
      { meetingId },
      { 
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: requestUserId
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
