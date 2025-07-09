import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';
import mongoose from 'mongoose';

/**
 * GET handler - Gets count of unread notifications for a user
 * 
 * @param request Query parameters: userId (required)
 * @returns JSON response with unread notification count
 */
export async function GET(request: NextRequest) {
  await connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid userId format' },
        { status: 400 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Count unread notifications for user (both user-specific and broadcast)
    const unreadCount = await Notification.countDocuments({
      $or: [
        { userId: userObjectId },
        { userId: null } // broadcast notifications
      ],
      isRead: false
    });

    return NextResponse.json(
      { success: true, unreadCount },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error getting unread notification count:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
