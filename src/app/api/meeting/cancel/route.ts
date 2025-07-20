import { NextResponse } from "next/server";
import connect from "@/lib/db";
import meetingSchema from "@/lib/models/meetingSchema";
import cancelMeetingSchema from "@/lib/models/cancelMeetingSchema";
import { validateAndExtractUserId } from "@/utils/jwtAuth";
import { createServerSystemApiHeaders } from "@/utils/systemApiAuth";

export async function POST(req: Request) {
  await connect();
  
  try {
    // Validate JWT token and extract user ID
    const tokenResult = validateAndExtractUserId(req as any);
    if (!tokenResult.isValid) {
      return NextResponse.json({ 
        message: "Unauthorized: " + tokenResult.error 
      }, { status: 401 });
    }
    
    const authenticatedUserId = tokenResult.userId;
    const { meetingId, cancelledBy, reason } = await req.json();

    // Validate input
    if (!meetingId || !cancelledBy || !reason?.trim()) {
      return NextResponse.json(
        { message: "Meeting ID, cancelled by user, and reason are required" },
        { status: 400 }
      );
    }

    // Validate that the authenticated user matches the cancelledBy user
    if (cancelledBy !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: You can only cancel meetings as yourself" 
      }, { status: 403 });
    }

    // Find the meeting
    const meeting = await meetingSchema.findById(meetingId);
    if (!meeting) {
      return NextResponse.json(
        { message: "Meeting not found" },
        { status: 404 }
      );
    }

    // Validate that the authenticated user is involved in this meeting
    const senderIdString = meeting.senderId.toString();
    const receiverIdString = meeting.receiverId.toString();
    
    if (senderIdString !== authenticatedUserId && receiverIdString !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: You can only cancel meetings you are involved in" 
      }, { status: 403 });
    }

    // Check if meeting can be cancelled
    if (meeting.state === 'cancelled' || meeting.state === 'rejected') {
      return NextResponse.json(
        { message: "Meeting is already cancelled or rejected" },
        { status: 400 }
      );
    }

    // Check if meeting is too close to start time or currently in progress
    const now = new Date();
    const meetingTime = new Date(meeting.meetingTime);
    const tenMinutesBefore = new Date(meetingTime.getTime() - 10 * 60 * 1000); // 10 minutes before
    const thirtyMinutesAfter = new Date(meetingTime.getTime() + 30 * 60 * 1000); // 30 minutes after

    if (meeting.state === 'accepted' && now >= tenMinutesBefore && now <= thirtyMinutesAfter) {
      const timeUntilMeeting = meetingTime.getTime() - now.getTime();
      const timeAfterMeeting = now.getTime() - meetingTime.getTime();
      
      let message;
      if (timeUntilMeeting > 0) {
        const minutesUntil = Math.ceil(timeUntilMeeting / (1000 * 60));
        message = `Cannot cancel meeting. The meeting starts in ${minutesUntil} minute${minutesUntil === 1 ? '' : 's'}. Meetings cannot be cancelled within 10 minutes of the start time.`;
      } else {
        const minutesAfter = Math.floor(timeAfterMeeting / (1000 * 60));
        message = `Cannot cancel meeting. The meeting started ${minutesAfter} minute${minutesAfter === 1 ? '' : 's'} ago and may still be in progress. Meetings cannot be cancelled for up to 30 minutes after the start time.`;
      }
      
      return NextResponse.json(
        { message },
        { status: 400 }
      );
    }

    // Update meeting state to cancelled
    meeting.state = 'cancelled';
    const updatedMeeting = await meeting.save();

    // Create cancellation record
    const cancellation = new cancelMeetingSchema({
      meetingId: meetingId,
      cancelledBy: cancelledBy,
      reason: reason.trim(),
      cancelledAt: new Date()
    });
    
    await cancellation.save();

    // Send notification to the other user
    try {
      const otherUserId = meeting.senderId.toString() === cancelledBy ? meeting.receiverId : meeting.senderId;
      
      // Get canceller's name for notification
      const cancellerResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/users/profile?id=${cancelledBy}`);
      let cancellerName = 'Unknown User';
      
      if (cancellerResponse.ok) {
        const cancellerData = await cancellerResponse.json();
        if (cancellerData.success && cancellerData.user) {
          cancellerName = `${cancellerData.user.firstName} ${cancellerData.user.lastName}`;
        }
      }

      // Send notification
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notification`, {
        method: 'POST',
        headers: createServerSystemApiHeaders(),
        body: JSON.stringify({
          userId: otherUserId,
          typeno: 10, // MEETING_CANCELLED
          description: `${cancellerName} has cancelled your meeting scheduled for ${new Date(meeting.meetingTime).toLocaleDateString()}. Reason: ${reason.trim()}`,
          targetDestination: '/dashboard'
        })
      });

      if (!notificationResponse.ok) {
        console.warn('Failed to send cancellation notification');
      }
    } catch (notificationError) {
      console.error('Error sending cancellation notification:', notificationError);
      // Don't fail the cancellation if notification fails
    }

    return NextResponse.json({ meeting: updatedMeeting }, { status: 200 });

  } catch (error: any) {
    console.error('Error cancelling meeting:', error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}