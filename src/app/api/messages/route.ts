import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import User from '@/lib/modals/userSchema';
import Message from '@/lib/modals/messageSchema';


export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    console.log('Request Body:', body); // Log the incoming request body

    const { chatRoomId, senderId, receiverId, content, attachment } = body;

    // Check for required fields
    if (!chatRoomId || !senderId || !receiverId) {
      console.error('Missing fields:', { chatRoomId, senderId, receiverId });
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const message = await Message.create({
      chatRoomId,
      senderId,
      receiverId,
      content,
      attachment,
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
