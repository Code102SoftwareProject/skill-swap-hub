import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ChatRoom from '@/lib/modals/chatRoomShema';

export async function GET(req: Request) {
  await connect();

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');  // e.g. /api/chatrooms?userId=abc123

    let query = {};
    if (userId) {
      // Find all chat rooms where userId is in the participants array
      query = { participants: userId };
    }

    const chatRooms = await ChatRoom.find(query);
    return NextResponse.json({ success: true, chatRooms }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await connect();

  try {
    const body = await req.json();
    const { participants } = body;

    // Must have exactly 2 participants
    if (!participants || participants.length !== 2) {
      return NextResponse.json(
        { success: false, message: 'A chat room must have exactly two participants' },
        { status: 400 }
      );
    }

    // Check if a room with these two participants already exists
    const existingRoom = await ChatRoom.findOne({
      participants: { $all: participants },
    });

    if (existingRoom) {
      // If it exists, just return it
      return NextResponse.json({ success: true, chatRoom: existingRoom }, { status: 200 });
    }

    // Otherwise, create a new room
    const chatRoom = await ChatRoom.create({ participants });

    return NextResponse.json({ success: true, chatRoom }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
