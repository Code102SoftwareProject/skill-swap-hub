import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';
import NotificationType from '@/lib/models/notificationTypeSchema';
import mongoose from 'mongoose';

/**
 ** POST handler - Creates a new notification
 * 
 * @param req JSON body containing: userIde typeno description targetDestination     
 * @returns JSON response with created notification
 *          
 */
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    console.log('Notification API - Received request body:', JSON.stringify(body));

    let { userId, typeno, description, targetDestination, broadcast } = body;

    // If broadcast is true, set userId to null
    if (broadcast === true) {
      userId = null;
    } else {
      // Validate userId is required when not broadcasting
      if (!userId) {
        console.error('Notification API - Missing userId for non-broadcast notification');
        return NextResponse.json(
          { success: false, message: 'userId is required when not broadcasting' },
          { status: 400 }
        );
      }
      
      // Validate userId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error(`Notification API - Invalid userId format: ${userId}`);
        return NextResponse.json(
          { success: false, message: 'Invalid userId format' },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!typeno || !description) {
      console.error('Notification API - Missing required fields:', { typeno, description });
      return NextResponse.json(
        { success: false, message: 'Missing required fields: typeno and description' },
        { status: 400 }
      );
    }

    // Find the notification type by its typeno
    console.log(`Notification API - Looking for notification type with typeno: ${typeno}`);
    const notificationType = await NotificationType.findOne({ typeno });
    
    if (!notificationType) {
      console.error(`Notification API - Invalid notification type: ${typeno} - not found in database`);
      return NextResponse.json(
        { success: false, message: 'Invalid notification type' },
        { status: 400 }
      );
    }

    console.log(`Notification API - Found notification type: ${notificationType.name} (${notificationType._id})`);

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

    console.log(`Notification API - Created notification with ID: ${notification._id}`);

    // Send the notification to the socket server
    try {
      const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET;
      console.log(`Notification API - Socket server URL: ${socketServerUrl}`);
      
      if (!socketServerUrl) {
        console.warn('Notification API - NEXT_PUBLIC_SOCKET environment variable is not set');
      }
      
      // Ensure the URL has a trailing slash if needed
      const socketUrl = socketServerUrl?.endsWith('/') 
        ? `${socketServerUrl}emit-notification` 
        : `${socketServerUrl}/emit-notification`;
      
      console.log(`Notification API - Sending to socket URL: ${socketUrl}`);
      
      const socketPayload = {
        userId: userId,
        broadcast: broadcast === true,
        description: description,
        targetDestination: targetDestination,
        type: notificationType.name,
        color: notificationType.color,
        notificationId: notification._id.toString()
      };
      
      console.log(`Notification API - Socket payload: ${JSON.stringify(socketPayload)}`);
      
      const socketResponse = await fetch(socketUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socketPayload)
      });
      
      const socketData = await socketResponse.text();
      console.log(`Notification API - Socket server response: ${socketResponse.status}`, socketData);
    } catch (socketError) {
      console.error('Notification API - Error sending notification to socket server:', socketError);
      // Continue even if the socket server fails
    }

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error: any) {
    console.error('Notification API - Error creating notification:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 ** GET handler - Retrieves notifications for a user
 * 
 * @param req Query  userId          
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
    
    // Find both user-specific notifications AND broadcast notifications 
    const notifications = await Notification.find({ 
      $or: [
        { userId: userObjectId },
        { userId: null } 
      ]
    })
      .populate('typeId')
      .sort({ createdAt: -1 });//newest

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



export async function DELETE(req: Request) {
  // validate with SYSTEM_API_KEY
  if (req.headers.get('x-api-key') !== process.env.SYSTEM_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  await connect();
  try{
    //delete all notifications created before 2 weeks
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const result = await Notification.deleteMany({ createdAt: { $lt: twoWeeksAgo } });  
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No notifications to delete' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: `${result.deletedCount} notifications deleted` },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      {success: false, message: error.message || "Server Error"},
      {status: 500}
    );
  }
}