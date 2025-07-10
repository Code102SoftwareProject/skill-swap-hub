import { NextResponse } from "next/server";
import connect from "@/lib/db";
import meetingSchema from "@/lib/models/meetingSchema";
import cancelMeetingSchema from "@/lib/models/cancelMeetingSchema";

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

      // Get canceller's name for notification
      const cancellerResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/profile?id=${cancelledBy}`);
      const cancellerData = await cancellerResponse.json();
      const cancellerName = cancellerData.success 
        ? `${cancellerData.user.firstName} ${cancellerData.user.lastName}`
        : 'Someone';

      // Format meeting time for notification
      const meetingDate = new Date(meeting.meetingTime);
      const formattedDate = meetingDate.toLocaleDateString();
      const formattedTime = meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const notificationDescription = `${cancellerName} cancelled your meeting scheduled for ${formattedDate} at ${formattedTime}. Reason: ${reason.trim()}`;

      // Send notification
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otherUserId,
          typeno: 4, // Assuming 4 is for meeting cancellation notifications
          description: notificationDescription,
          targetDestination: `/messages`, // Or wherever meetings are managed
          broadcast: false
        }),
      });

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