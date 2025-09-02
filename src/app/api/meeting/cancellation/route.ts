import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import cancelMeetingSchema from "@/lib/models/cancelMeetingSchema";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

// Get cancellation details
export async function GET(req: NextRequest) {
  await connect();
  
  try {
    // Validate authentication
    const authenticatedUserId = await validateAndExtractUserId(req);
    if (!authenticatedUserId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const url = new URL(req.url);
    const meetingId = url.searchParams.get('meetingId');
    const userId = url.searchParams.get('userId');
    const includeAcknowledged = url.searchParams.get('includeAcknowledged') === 'true';

    if (!meetingId) {
      return NextResponse.json(
        { message: "Meeting ID is required" },
        { status: 400 }
      );
    }

    // Verify the user can only access their own cancellation data
    if (userId && userId !== authenticatedUserId.userId) {
      return NextResponse.json(
        { message: "Cannot access cancellation data for another user" },
        { status: 403 }
      );
    }

    if (!meetingId) {
      return NextResponse.json(
        { message: "Meeting ID is required" },
        { status: 400 }
      );
    }

    let query: any = { meetingId };
    
    // If userId is provided and includeAcknowledged is false, filter out acknowledged cancellations for that user
    if (userId && !includeAcknowledged) {
      query.$or = [
        { acknowledged: false },
        { acknowledgedBy: { $ne: userId } }
      ];
    }

    const cancellation = await cancelMeetingSchema.findOne(query);

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
export async function PATCH(req: NextRequest) {
  await connect();
  
  try {
    // Validate authentication
    const authenticatedUserId = await validateAndExtractUserId(req);
    if (!authenticatedUserId) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const { cancellationId, acknowledgedBy } = await req.json();

    if (!cancellationId || !acknowledgedBy) {
      return NextResponse.json(
        { message: "Cancellation ID and acknowledged by user are required" },
        { status: 400 }
      );
    }

    // Verify the user can only acknowledge for themselves
    if (acknowledgedBy !== authenticatedUserId.userId) {
      return NextResponse.json(
        { message: "Cannot acknowledge cancellation for another user" },
        { status: 403 }
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