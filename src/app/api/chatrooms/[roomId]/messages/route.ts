import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import Message from '@/lib/modals/messageSchema';

export async function GET(req: NextRequest, context: { params: { roomId: string } }) {
  await connect();

  try {
    // Await the params object if needed
    const { roomId } = await context.params;

    const messages = await Message.find({ chatRoomId: roomId })
      .populate('sender', 'name email') // Add the fields you want to include from the user
      .sort({ timestamp: 1 }); // Sort by timestamp ascending

    return NextResponse.json(
      { success: true, messages },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: { params: { roomId: string } }) {
  await connect();

  try {
    // Await the params object if needed
    const { roomId } = await context.params;

    const body = await req.json();
    const { content, sender } = body;

    if (!content || !sender) {
      return NextResponse.json(
        { success: false, message: 'Content and sender are required' },
        { status: 400 }
      );
    }

    const message = await Message.create({
      chatRoomId: roomId,
      content,
      sender
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email');

    return NextResponse.json(
      { success: true, message: populatedMessage },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
