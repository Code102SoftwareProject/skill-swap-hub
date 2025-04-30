import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';
import mongoose from 'mongoose';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { notificationId } = body;
    
    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required" },
        { status: 400 }
      );
    }

    await connect();
    
    // Check if notification ID is valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(notificationId)) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID format" },
        { status: 400 }
      );
    }

    // Find and update the notification
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true } // Return the updated document
    );

    if (!updatedNotification) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Notification marked as read",
        notification: updatedNotification 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}