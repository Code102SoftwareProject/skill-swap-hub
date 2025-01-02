import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ChatRoom from '@/lib/modals/chatRoomShema';

export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    let query = {};
    if (userId) {
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

    if (!participants || participants.length !== 2) {
      return NextResponse.json(
        { success: false, message: 'A chat room must have exactly two participants' },
        { status: 400 }
      );
    }

    const existingRoom = await ChatRoom.findOne({ participants: { $all: participants } });

    if (existingRoom) {
      return NextResponse.json({ success: true, chatRoom: existingRoom }, { status: 200 });
    }

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
