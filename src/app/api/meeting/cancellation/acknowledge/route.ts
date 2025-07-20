import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import cancelMeetingSchema from '@/lib/models/cancelMeetingSchema';
import { validateAndExtractUserId } from '@/utils/jwtAuth';

export async function POST(request: NextRequest) {
  try {
    await connect();

    // Validate JWT token and extract user ID
    const tokenResult = validateAndExtractUserId(request);
    if (!tokenResult.isValid) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized: " + tokenResult.error 
      }, { status: 401 });
    }
    
    const authenticatedUserId = tokenResult.userId;

    const { meetingId, userId } = await request.json();

    if (!meetingId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Meeting ID and User ID are required' },
        { status: 400 }
      );
    }

    // Validate that the authenticated user matches the provided userId
    if (userId !== authenticatedUserId) {
      return NextResponse.json({ 
        success: false, 
        message: "Forbidden: You can only acknowledge cancellations as yourself" 
      }, { status: 403 });
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
