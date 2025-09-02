import meetingSchema from "@/lib/models/meetingSchema";
import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connect();
  
  try {
    // Validate authentication
    const authenticatedUserId = await validateAndExtractUserId(req);
    if (!authenticatedUserId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(id);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // Verify user authorization - only participants can access meeting details
    if (meeting.senderId.toString() !== authenticatedUserId.userId && meeting.receiverId.toString() !== authenticatedUserId.userId) {
      return NextResponse.json({ message: "Unauthorized to access this meeting" }, { status: 403 });
    }

    return NextResponse.json(meeting, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connect();
  
  try {
    // Validate authentication
    const authenticatedUserId = await validateAndExtractUserId(req);
    if (!authenticatedUserId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const updateData = await req.json();
    
    if (!id) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(id);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // Verify user authorization - only participants can update meetings
    if (meeting.senderId.toString() !== authenticatedUserId.userId && meeting.receiverId.toString() !== authenticatedUserId.userId) {
      return NextResponse.json({ message: "Unauthorized to update this meeting" }, { status: 403 });
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
