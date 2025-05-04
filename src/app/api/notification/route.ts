import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';
import mongoose from 'mongoose';

/**
 ** POST handler - Creates a new notification
 * 
 * @param req JSON body containing:
 *            - userId: ID of the user to receive the notification (required)
 *            - type: Type of notification (e.g., "message", "request", "system") (required)
 *            - description: Content/message of the notification (required)
 *            - targetDestination: Optional URL or path where clicking the notification should lead
 *            
 * @returns JSON response with created notification
 *          
 */
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    console.log('Received body:', body);

    const { userId, type, description, targetDestination } = body;

    // Validate required fields
    if (!userId || !type || !description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid userId format' },
        { status: 400 }
      );
    }

    // Convert userId string to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const notification = await Notification.create({
      userId: userObjectId,
      type,
      description,
      targetDestination,
      isRead: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


