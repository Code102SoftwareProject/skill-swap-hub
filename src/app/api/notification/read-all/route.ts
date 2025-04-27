import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';
import mongoose from 'mongoose';

// Handler for PUT request to mark all notifications for a user as read
export async function PUT(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Validate userId presence
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required in query parameters' },
        { status: 400 }
      );
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Convert userId string to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Update all notifications for the given user to set isRead to true
    const updateResult = await Notification.updateMany(
      { userId: userObjectId, isRead: false }, // Only update unread notifications
      { $set: { isRead: true } }
    );

    // Return success response, indicating how many were modified
    return NextResponse.json(
      {
        success: true,
        message: `Marked ${updateResult.modifiedCount} notifications as read.`,
        modifiedCount: updateResult.modifiedCount,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}