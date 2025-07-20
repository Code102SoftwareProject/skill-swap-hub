import { NextResponse } from "next/server";
import connect from "@/lib/db";
import cancelMeetingSchema from "@/lib/models/cancelMeetingSchema";
import meetingSchema from "@/lib/models/meetingSchema";
import userSchema from "@/lib/models/userSchema";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

// Get all unacknowledged cancellations for a user
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
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate that the authenticated user matches the requested userId
    if (userId !== authenticatedUserId) {
      return NextResponse.json({ 
        message: "Forbidden: Cannot access other user's cancellation data" 
      }, { status: 403 });
    }

    // Find all meetings involving this user
    const userMeetings = await meetingSchema.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ],
      state: 'cancelled'
    }).select('_id senderId receiverId meetingTime description');

    if (userMeetings.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const meetingIds = userMeetings.map(meeting => meeting._id);

    // Find all cancellations for these meetings that haven't been acknowledged by this user
    const unacknowledgedCancellations = await cancelMeetingSchema.find({
      meetingId: { $in: meetingIds },
      $and: [
        {
          $or: [
            { acknowledged: false },
            { acknowledged: { $exists: false } }
          ]
        },
        {
          // Make sure the user didn't cancel it themselves
          cancelledBy: { $ne: userId }
        }
      ]
    }).populate('cancelledBy', 'firstName lastName')
      .populate('meetingId', 'senderId receiverId meetingTime description')
      .lean();

    // Format the response with meeting details and canceller info
    const formattedCancellations = unacknowledgedCancellations.map(cancellation => {
      const meeting = userMeetings.find(m => m._id.toString() === cancellation.meetingId.toString());
      const cancellerInfo = cancellation.cancelledBy as any;
      
      return {
        _id: cancellation._id,
        meetingId: cancellation.meetingId,
        reason: cancellation.reason,
        cancelledAt: cancellation.cancelledAt,
        cancellerName: cancellerInfo ? `${cancellerInfo.firstName} ${cancellerInfo.lastName}` : 'Unknown User',
        meetingTime: meeting?.meetingTime,
        meetingDescription: meeting?.description || 'Meeting'
      };
    });

    return NextResponse.json(formattedCancellations, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching unacknowledged cancellations:', error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
