import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';
import mongoose from 'mongoose';

// Handler for PUT request to mark a specific notification as read
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  try {
    const notificationId = params.id;

    // Validate notificationId format
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification ID format' },
        { status: 400 }
      );
    }

    // Find the notification by ID and update its isRead status to true
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { $set: { isRead: true } },
      { new: true } // Return the updated document
    );

    // Check if the notification was found and updated
    if (!updatedNotification) {
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    // Return success response with the updated notification
    return NextResponse.json(
      { success: true, notification: updatedNotification },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}