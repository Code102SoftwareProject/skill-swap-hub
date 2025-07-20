import { NextResponse } from "next/server";
import connect from "@/lib/db";
import cancelMeetingSchema from "@/lib/models/cancelMeetingSchema";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

// Get cancellation details
export async function GET(req: Request) {
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

    // Validate that the authenticated user matches the requested userId (if provided)
    if (userId && userId !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: Cannot access other user's cancellation data" 
      }, { status: 403 });
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
export async function PATCH(req: Request) {
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
    const { cancellationId, acknowledgedBy } = await req.json();

    if (!cancellationId || !acknowledgedBy) {
      return NextResponse.json(
        { message: "Cancellation ID and acknowledged by user are required" },
        { status: 400 }
      );
    }

    // Validate that the authenticated user matches the acknowledgedBy user
    if (acknowledgedBy !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: You can only acknowledge cancellations as yourself" 
      }, { status: 403 });
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