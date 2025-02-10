import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Message from '@/lib/modals/messageSchema';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    console.log('Received body:', body);

    const { chatRoomId, senderId, receiverId, content } = body;

    // Validate required fields
    if (!chatRoomId || !senderId || !receiverId || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert string ID to ObjectId
    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);

    // Create a new message document
    const message = await Message.create({
      chatRoomId: chatRoomObjectId,
      senderId,
      receiverId,
      content,
      sentAt: new Date(),
      readStatus: false
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  await connect();

  try {
    // Extract query params from the request URL
    const { searchParams } = new URL(req.url);
    const chatRoomId = searchParams.get('chatRoomId');
    const lastMessageOnly = searchParams.get('lastMessage') === 'true';

    if (!chatRoomId) {
      return NextResponse.json(
        { success: false, message: 'ChatRoom ID is required' },
        { status: 400 }
      );
    }

    // Convert the string ID to ObjectId
    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);

    if (lastMessageOnly) {
      // Return only the last message (by sentAt descending)
      const lastMessage = await Message.findOne({ chatRoomId: chatRoomObjectId })
        .sort({ sentAt: -1 });

      return NextResponse.json({ success: true, message: lastMessage }, { status: 200 });
    }

    // Otherwise, return all messages sorted by sentAt ascending
    const messages = await Message.find({ chatRoomId: chatRoomObjectId })
      .sort({ sentAt: 1 });

    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
