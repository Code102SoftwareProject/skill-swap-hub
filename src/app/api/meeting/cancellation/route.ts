import { NextResponse } from "next/server";
import connect from "@/lib/db";
import cancelMeetingSchema from "@/lib/models/cancelMeetingSchema";

// Get cancellation details
export async function GET(req: Request) {
  await connect();
  
  try {
    const url = new URL(req.url);
    const meetingId = url.searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json(
        { message: "Meeting ID is required" },
        { status: 400 }
      );
    }

    const cancellation = await cancelMeetingSchema.findOne({ meetingId });

    return NextResponse.json(cancellation, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching cancellation details:', error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Acknowledge cancellation
export async function PATCH(req: Request) {
  await connect();
  
  try {
    const { cancellationId, acknowledgedBy } = await req.json();

    if (!cancellationId || !acknowledgedBy) {
      return NextResponse.json(
        { message: "Cancellation ID and acknowledged by user are required" },
        { status: 400 }
      );
    }

    const cancellation = await cancelMeetingSchema.findById(cancellationId);
    
    if (!cancellation) {
      return NextResponse.json(
        { message: "Cancellation record not found" },
        { status: 404 }
      );
    }

    if (cancellation.acknowledged) {
      return NextResponse.json(
        { message: "Cancellation already acknowledged" },
        { status: 400 }
      );
    }

    cancellation.acknowledged = true;
    cancellation.acknowledgedAt = new Date();
    cancellation.acknowledgedBy = acknowledgedBy;

    await cancellation.save();

    return NextResponse.json(cancellation, { status: 200 });

  } catch (error: any) {
    console.error('Error acknowledging cancellation:', error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}