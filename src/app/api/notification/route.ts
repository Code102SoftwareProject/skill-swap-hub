import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';
import NotificationType from '@/lib/models/notificationTypeSchema';
import mongoose from 'mongoose';

/**
 ** POST handler - Creates a new notification
 * 
 * @param req JSON body containing:
 *            - userId: ID of the user to receive the notification (required unless broadcast is true)
 *            - typeno: Type number of the notification (required)
 *            - description: Content/message of the notification (required)
 *            - targetDestination: Optional URL or path where clicking the notification should lead
 *            - broadcast: Boolean indicating if this is a broadcast notification (optional)
 *            
 * @returns JSON response with created notification
 *          
 */
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    console.log('Received body:', body);

    let { userId, typeno, description, targetDestination, broadcast } = body;

    // If broadcast is true, set userId to null
    if (broadcast === true) {
      userId = null;
    } else {
      // Validate userId is required when not broadcasting
      if (!userId) {
        return NextResponse.json(
          { success: false, message: 'userId is required when not broadcasting' },
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
    }

    // Validate required fields
    if (!typeno || !description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: typeno and description' },
        { status: 400 }
      );
    }

    // Find the notification type by its typeno
    const notificationType = await NotificationType.findOne({ typeno });
    
    if (!notificationType) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Convert userId string to ObjectId if it's not null
    const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

    const notification = await Notification.create({
      userId: userObjectId,
      typeId: notificationType._id,
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

/**
 ** GET handler - Retrieves notifications for a user
 * 
 * @param req Query parameters containing:
 *            - userId: ID of the user whose notifications are to be retrieved (required)
 *            
 * @returns JSON response with notifications
 *          
 */
export async function GET(req: Request){
  await connect();
  try{
    const {searchParams} = new URL(req.url);
    const userId = searchParams.get('userId');

    if(!userId){
      return NextResponse.json(
        {message:"userId is Required", success:false},
        {status:400}
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Find both user-specific notifications AND broadcast notifications (where userId is null)
    const notifications = await Notification.find({ 
      $or: [
        { userId: userObjectId },
        { userId: null }  // Include broadcast notifications
      ]
    })
      .populate('typeId')
      .sort({ createdAt: -1 });

    if(!notifications || notifications.length === 0){
      return NextResponse.json(
        {message:"No Notifications Found", success:false},
        {status:200}
      );
    }

    // Transform notifications to include typename and color directly
    const formattedNotifications = notifications.map(notification => {
      const notificationObj = notification.toObject();
      
      // Extract type information and add directly to root level
      notificationObj.typename = notificationObj.typeId.name;
      notificationObj.color = notificationObj.typeId.color;
      
      // Optional: Remove or keep the typeId object depending on your needs
      // If you want to remove the nested typeId object:
      delete notificationObj.typeId;
      
      return notificationObj;
    });

    return NextResponse.json(
      {success:true, notifications: formattedNotifications},
      {status:200}
    )

  }catch(error:any){
    return NextResponse.json(
      {success:false, message:error.message || "Server Error"},
      {status:500}
    );
  }
}