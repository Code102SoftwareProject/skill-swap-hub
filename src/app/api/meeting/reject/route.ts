import meetingSchema from "@/lib/models/meetingSchema";
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

export async function POST(req: NextRequest) {
  await connect();
  try {
    // Validate authentication
    const authResult = await validateAndExtractUserId(req);
    if (!authResult) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { meetingId } = await req.json();
    
    if (!meetingId) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(meetingId);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // Verify user authorization - only participants can reject meetings
    if (meeting.senderId.toString() !== authResult.userId && meeting.receiverId.toString() !== authResult.userId) {
      return NextResponse.json({ message: "Unauthorized to reject this meeting" }, { status: 403 });
    }

    // ! Reject
    meeting.state = "rejected";
    const updatedMeeting = await meeting.save();
    
    return NextResponse.json(updatedMeeting, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}