import meetingSchema from "@/lib/models/meetingSchema";
import { NextResponse } from "next/server";
import connect from "@/lib/db";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

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
    const { meetingId } = await req.json();
    
    if (!meetingId) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(meetingId);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // Validate that the authenticated user is the receiver (only receivers can reject)
    if (meeting.receiverId !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: Only the meeting receiver can reject the meeting" 
      }, { status: 403 });
    }

    // ! Reject
    meeting.state = "rejected";
    const updatedMeeting = await meeting.save();
    
    return NextResponse.json(updatedMeeting, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}