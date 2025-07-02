import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Message from "@/lib/models/messageSchema";
import mongoose from "mongoose";

/**
 * PATCH handler for updating message delivery status
 */
export async function PATCH(req: Request) {
  await connect();
  try {
    // Check for system API key (for socket server) or user authentication
    const systemApiKey = req.headers.get('x-system-api-key');
    const isSystemRequest = systemApiKey === process.env.SYSTEM_API_KEY;
    
    if (!isSystemRequest) {
      // If not a system request, require user authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, message: "Authentication required" },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const { messageId, deliveryStatus } = body;

    if (!messageId || !deliveryStatus) {
      return NextResponse.json(
        { success: false, message: "messageId and deliveryStatus are required" },
        { status: 400 }
      );
    }

    if (!['sent', 'delivered', 'read'].includes(deliveryStatus)) {
      return NextResponse.json(
        { success: false, message: "Invalid deliveryStatus. Must be 'sent', 'delivered', or 'read'" },
        { status: 400 }
      );
    }

    // Convert messageId to ObjectId if it's not already
    const messageObjectId = new mongoose.Types.ObjectId(messageId);

    // Find and update the message
    const updatedMessage = await Message.findByIdAndUpdate(
      messageObjectId,
      { deliveryStatus },
      { new: true }
    );

    if (!updatedMessage) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Message delivery status updated successfully",
        updatedMessage 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating message delivery status:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET handler for fetching message delivery status
 */
export async function GET(req: Request) {
  await connect();
  try {
    const url = new URL(req.url);
    const chatRoomId = url.searchParams.get('chatRoomId');

    if (!chatRoomId) {
      return NextResponse.json(
        { success: false, message: "chatRoomId is required" },
        { status: 400 }
      );
    }

    // Convert chatRoomId to ObjectId
    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId);

    // Get delivery status for all messages in the chat room
    const messages = await Message.find(
      { chatRoomId: chatRoomObjectId },
      { _id: 1, deliveryStatus: 1 }
    );

    const deliveryStatusMap: Record<string, string> = {};
    messages.forEach(msg => {
      if (msg._id) {
        deliveryStatusMap[msg._id.toString()] = msg.deliveryStatus || 'sent';
      }
    });

    return NextResponse.json(
      { 
        success: true, 
        deliveryStatus: deliveryStatusMap
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching message delivery status:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
