import meetingSchema from "@/lib/models/meetingSchema";
import { NextResponse } from "next/server";
import connect from "@/lib/db";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(id);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // Validate that the authenticated user is involved in this meeting
    if (meeting.senderId.toString() !== authenticatedUserId && meeting.receiverId.toString() !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: You can only access meetings you are involved in" 
      }, { status: 403 });
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
    // Validate JWT token and extract user ID
    const tokenResult = validateAndExtractUserId(req as any);
    if (!tokenResult.isValid) {
      return NextResponse.json({ 
        message: "Unauthorized: " + tokenResult.error 
      }, { status: 401 });
    }
    
    const authenticatedUserId = tokenResult.userId;
    const { id } = await params;
    const updateData = await req.json();
    
    if (!id) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 });
    }

    const meeting = await meetingSchema.findById(id);

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 });
    }

    // Validate that the authenticated user is involved in this meeting
    if (meeting.senderId.toString() !== authenticatedUserId && meeting.receiverId.toString() !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: You can only update meetings you are involved in" 
      }, { status: 403 });
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
