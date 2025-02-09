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

    // Create message using senderId/receiverId directly
    const message = await Message.create({
      chatRoomId: chatRoomObjectId,
      senderId,    // Match schema field name
      receiverId,  // Match schema field name
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
    const { searchParams } = new URL(req.url);
    const chatRoomId = searchParams.get('chatRoomId');
    const lastMessageOnly = searchParams.get('lastMessage') === 'true';

    if (!chatRoomId) {
      return NextResponse.json(
        { success: false, message: 'ChatRoom ID is required' },
        { status: 400 }
      );
    }

    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);
    
    if (lastMessageOnly) {
      // Get only the last message
      const lastMessage = await Message.findOne({ 
        chatRoomId: chatRoomObjectId 
      }).sort({ sentAt: -1 });
      
      return NextResponse.json({ success: true, message: lastMessage }, { status: 200 });
    }

    // Get all messages
    const messages = await Message.find({ 
      chatRoomId: chatRoomObjectId 
    }).sort({ sentAt: 1 });
    
    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Make a GET request to /api/messages?chatRoomId={CHATROOM_ID}

// Example fetch call:
const response = await fetch(`/api/messages?chatRoomId=${chatRoomId}`);
const data = await response.json();

if (data.success) {
  const messages = data.messages; // Array of messages sorted by sentAt
} else {
  console.error(data.message);
}
