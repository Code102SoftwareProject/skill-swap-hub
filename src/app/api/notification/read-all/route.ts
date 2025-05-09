import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';

/**
 ** PATCH handler - Marks all unread notifications as read for a specific user
 * 
 * @param request Request with query parameters:
 *                - userId: ID of the user whose notifications should be marked as read (required)
 *               
 * 
 * @returns JSON response with result summary
 *          
 */
export async function PATCH(request: NextRequest) {
  await connect();
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { userId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json(
      { 
        success: true, 
        message: `${result.modifiedCount} notifications marked as read` 
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