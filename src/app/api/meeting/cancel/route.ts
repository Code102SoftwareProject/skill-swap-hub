import { NextResponse } from "next/server";
import connect from "@/lib/db";
import meetingSchema from "@/lib/models/meetingSchema";
import cancelMeetingSchema from "@/lib/models/cancelMeetingSchema";
import { cancelMeetingWithReason } from "@/services/meetingApiServices";

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

    // Use service function to handle cancellation with notification
    const result = await cancelMeetingWithReason(meetingId, cancelledBy, reason.trim());

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error cancelling meeting:', error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}