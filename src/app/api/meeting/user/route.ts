import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import meetingSchema from '@/lib/models/meetingSchema';

// GET - Get all meetings for a user
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching meetings for user:', userId);

    // Get all meetings where user is either sender or receiver
    const meetings = await meetingSchema.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).sort({ sentAt: -1 });

    console.log('Found meetings:', meetings.length);

    return NextResponse.json(meetings, { status: 200 });

  } catch (error: any) {
    console.error('Meeting user API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
