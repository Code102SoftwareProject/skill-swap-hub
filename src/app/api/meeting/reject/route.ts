import meetingSchema from "@/lib/models/meetingSchema";
import { NextResponse } from "next/server";
import connect from "@/lib/db";

export async function POST(req: Request) {
  await connect();
  try {
    const { meetingId } = await req.json();
    
    if (!meetingId) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(meetingId);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // ! Reject
    meeting.state = "rejected";
    const updatedMeeting = await meeting.save();
    
    return NextResponse.json(updatedMeeting, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}