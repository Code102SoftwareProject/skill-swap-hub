import meetingSchema from "@/lib/models/meetingSchema";
import { NextResponse } from "next/server";
import connect from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connect();
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(id);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json(meeting, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connect();
  
  try {
    const { id } = await params;
    const updateData = await req.json();
    
    if (!id) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(id);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // Update the meeting with the provided data
    Object.assign(meeting, updateData);
    const updatedMeeting = await meeting.save();

    return NextResponse.json(updatedMeeting, { status: 200 });
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
