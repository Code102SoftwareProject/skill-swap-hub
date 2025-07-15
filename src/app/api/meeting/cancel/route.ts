import { NextResponse } from "next/server";
import connect from "@/lib/db";
import meetingSchema from "@/lib/models/meetingSchema";
import cancelMeetingSchema from "@/lib/models/cancelMeetingSchema";

// Import notification helper function
const { sendMeetingCancelledNotification } = require('@/utils/meetingNotifications');

export async function POST(req: Request) {
  await connect();
  
  try {
    const { meetingId, cancelledBy, reason } = await req.json();

    // Validate input
    if (!meetingId || !cancelledBy || !reason?.trim()) {
      return NextResponse.json(
        { message: "Meeting ID, cancelled by user, and reason are required" },
        { status: 400 }
      );
    }

    // Find the meeting
    const meeting = await meetingSchema.findById(meetingId);
    if (!meeting) {
      return NextResponse.json(
        { message: "Meeting not found" },
        { status: 404 }
      );
    }

    // Check if meeting can be cancelled
    if (meeting.state === 'cancelled' || meeting.state === 'rejected') {
      return NextResponse.json(
        { message: "Meeting is already cancelled or rejected" },
        { status: 400 }
      );
    }

    // Create cancellation record
    const cancellation = new cancelMeetingSchema({
      meetingId,
      cancelledBy,
      reason: reason.trim()
    });

    await cancellation.save();

    // Update meeting state
    meeting.state = 'cancelled';
    await meeting.save();

    // Send notification to the other user
    try {
      const otherUserId = meeting.senderId.toString() === cancelledBy 
        ? meeting.receiverId.toString() 
        : meeting.senderId.toString();

      // Send cancellation notification using our new notification system
      await sendMeetingCancelledNotification(
        otherUserId,
        cancelledBy,
        reason.trim()
      );

      console.log('Cancellation notification sent successfully');
    } catch (notificationError) {
      console.error('Error sending cancellation notification:', notificationError);
      // Continue even if notification fails
    }

    return NextResponse.json({
      meeting,
      cancellation
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error cancelling meeting:', error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}