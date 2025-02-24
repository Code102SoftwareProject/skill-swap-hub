import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Message from "@/lib/models/messageSchema";
import ChatRoom from "@/lib/models/chatRoomSchema";
import mongoose from "mongoose";

export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    console.log("Received body:", body);

    const { chatRoomId, senderId, content, replyFor } = body;

    if (!chatRoomId || !senderId || !content) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);
    let replyForObjectId = null;

    if (replyFor) {
      if (!mongoose.Types.ObjectId.isValid(replyFor)) {
        return NextResponse.json(
          { success: false, message: "Invalid replyFor ID" },
          { status: 400 }
        );
      }
      replyForObjectId = new mongoose.Types.ObjectId(replyFor);
    }

    const chatRoom = await ChatRoom.findById(chatRoomObjectId);
    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chat room not found" },
        { status: 404 }
      );
    }

    const message = await Message.create({
      chatRoomId: chatRoomObjectId,
      senderId,
      content,
      sentAt: new Date(),
      readStatus: false,
      replyFor: replyForObjectId
    });

    chatRoom.lastMessage = {
      content,
      sentAt: new Date(),
      senderId,
    };
    await chatRoom.save();

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating message:", error);
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
    const chatRoomId = searchParams.get("chatRoomId");
    const lastMessageOnly = searchParams.get("lastMessage") === "true";

    if (!chatRoomId) {
      return NextResponse.json(
        { success: false, message: "ChatRoom ID is required" },
        { status: 400 }
      );
    }

    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);

    if (lastMessageOnly) {
      const lastMessage = await Message.findOne({ chatRoomId: chatRoomObjectId })
        .sort({ sentAt: -1 })
        .populate("replyFor", "content senderId sentAt");

      return NextResponse.json(
        { success: true, message: lastMessage },
        { status: 200 }
      );
    }

    const messages = await Message.find({ chatRoomId: chatRoomObjectId })
      .sort({ sentAt: 1 })
      .populate("replyFor", "content senderId sentAt"); 

    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, message: "Message ID is required" },
        { status: 400 }
      );
    }

    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    if (existingMessage.readStatus) {
      return NextResponse.json(
        { success: true, message: "Message already read", updatedMessage: existingMessage },
        { status: 200 }
      );
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { readStatus: true },
      { new: true }
    );

    return NextResponse.json(
      { success: true, updatedMessage },
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

export async function DELETE(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { success: false, message: "Message ID is required" },
        { status: 400 }
      );
    }

    const existingMessage = await Message.findById(messageId);
    if (!existingMessage) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    await Message.findByIdAndDelete(messageId);

    return NextResponse.json(
      { success: true, message: "Message deleted successfully" },
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
