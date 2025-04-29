import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Message from "@/lib/models/messageSchema";
import ChatRoom from "@/lib/models/chatRoomSchema";
import mongoose from "mongoose";
import { encryptMessage, decryptMessage } from "@/lib/messageEncryption/encryption";


export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    //console.log("Received body:", body);

    const { chatRoomId, senderId, content, replyFor } = body;

    // Check if content is a file link and skip encryption if it is
    const isFileLink = content.startsWith('File:');
    const encryptedContent: string = isFileLink ? content : encryptMessage(content);

    if (!chatRoomId || !senderId || !content) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // This constructor usage is deprecated but still works
    // Consider using one of these alternatives:
    // Option 1: mongoose.Types.ObjectId.createFromHexString(chatRoomId)
    // Option 2: Import ObjectId directly and use new ObjectId(chatRoomId)
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
      content: encryptedContent,
      sentAt: new Date(),
      readStatus: false,
      replyFor: replyForObjectId
    });

    // For chat room's lastMessage, use unencrypted content, limited to 18 chars
    let lastMessageContent;
    if (isFileLink) {
      // For files, keep the "File:" prefix but truncate if needed
      const parts = content.split(':');
      if (parts.length >= 2) {
        // Truncate the file name if needed
        const fileName = parts[1].length > 15 ? parts[1].substring(0, 15) + '...' : parts[1];
        lastMessageContent = `File:${fileName}`;
      } else {
        lastMessageContent = "File";
      }
    } else {
      // For regular messages, truncate to 18 chars
      lastMessageContent = content.length > 18 ? content.substring(0, 18) + '...' : content;
    }

    chatRoom.lastMessage = {
      content: lastMessageContent,
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
      
      // Decrypt message content if exists
      if (lastMessage) {
        lastMessage.content = lastMessage.content.startsWith('File:') 
          ? lastMessage.content 
          : decryptMessage(lastMessage.content);
        
        // Decrypt reply content if exists
        if (lastMessage.replyFor && lastMessage.replyFor.content) {
          lastMessage.replyFor.content = lastMessage.replyFor.content.startsWith('File:')
            ? lastMessage.replyFor.content
            : decryptMessage(lastMessage.replyFor.content);
        }
      }

      return NextResponse.json(
        { success: true, message: lastMessage },
        { status: 200 }
      );
    }

    const messages = await Message.find({ chatRoomId: chatRoomObjectId })
      .sort({ sentAt: 1 })
      .populate("replyFor", "content senderId sentAt"); 
    
    // Decrypt all message contents
    const decryptedMessages = messages.map(message => {
      // Create a new object to avoid modifying the database documents directly
      const messageObj = message.toObject();
      messageObj.content = messageObj.content.startsWith('File:')
        ? messageObj.content
        : decryptMessage(messageObj.content);
      
      // Decrypt reply content if exists
      if (messageObj.replyFor && messageObj.replyFor.content) {
        messageObj.replyFor.content = messageObj.replyFor.content.startsWith('File:')
          ? messageObj.replyFor.content
          : decryptMessage(messageObj.replyFor.content);
      }
      
      return messageObj;
    });

    return NextResponse.json({ success: true, messages: decryptedMessages }, { status: 200 });
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
