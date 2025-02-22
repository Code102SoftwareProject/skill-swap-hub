import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Message from '@/lib/modals/messageSchema';
import ChatRoom from '@/lib/modals/chatRoomSchema';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    console.log('Received body:', body);
    
    // Only expect chatRoomId, senderId, and content from the client
    const { chatRoomId, senderId, content } = body;

    // Validate required fields
    if (!chatRoomId || !senderId || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert chatRoomId string to ObjectId
    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);

    // Look up the chat room to update its lastMessage
    const chatRoom = await ChatRoom.findById(chatRoomObjectId);
    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: 'Chat room not found' },
        { status: 404 }
      );
    }

    // Create a new message document without receiverId.
    const message = await Message.create({
      chatRoomId: chatRoomObjectId,
      senderId,
      content,
      sentAt: new Date(),
      readStatus: false,
    });

    // Update the chat room's lastMessage field for preview purposes.
    chatRoom.lastMessage = {
      content,
      sentAt: new Date(),
      senderId,
    };
    await chatRoom.save();

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
    // Extract query parameters from the request URL
    const { searchParams } = new URL(req.url);
    const chatRoomId = searchParams.get('chatRoomId');
    const lastMessageOnly = searchParams.get('lastMessage') === 'true';

    if (!chatRoomId) {
      return NextResponse.json(
        { success: false, message: 'ChatRoom ID is required' },
        { status: 400 }
      );
    }

    // Convert chatRoomId string to ObjectId
    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);

    if (lastMessageOnly) {
      // Return only the last message (sorted by sentAt descending)
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

export async function DELETE(req: Request) {
  await connect();
  // Implement deletion logic if needed.
  return NextResponse.json({ success: false, message: 'Not implemented' }, { status: 501 });
}
