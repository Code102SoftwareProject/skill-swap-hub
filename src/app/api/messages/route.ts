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

    if (!chatRoomId) {
      return NextResponse.json(
        { success: false, message: 'ChatRoom ID is required' },
        { status: 400 }
      );
    }

    // Convert string ID to ObjectId for querying
    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);
    const messages = await Message.find({ chatRoomId: chatRoomObjectId }).sort({ sentAt: 1 });
    
    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
