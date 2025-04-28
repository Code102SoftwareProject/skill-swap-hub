import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Notification from '@/lib/models/notificationSchema';
import mongoose from 'mongoose';

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

    // Validate  userId is a valid MongoDB ObjectId
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


export async function GET(req: Request){
    await connect();
    try{
      const {searchParams} = new URL(req.url);
      const userId =searchParams.get("userId");

      if(!userId){
        return NextResponse.json(
          {success: false, message: "User ID is required"},
          {status: 400}
        )
      }


      // Validate userId format
      if(!mongoose.Types.ObjectId.isValid(userId)){
        return NextResponse.json(
          {success: false, message: "Invalid userId format"},
          {status: 400}
        )
      }

      // Convert userId string to ObjectId
      const userObjectId = new mongoose.Types.ObjectId(userId);

      // Fetch notifications for the user, sorting by creation date (newest first)
      const notifications = await Notification.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(
        { success: true, notifications },
        { status: 200 }
      );

    }catch(error:any){
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        {success: false, message: error.message},
        {status: 500}
      )
    }
}