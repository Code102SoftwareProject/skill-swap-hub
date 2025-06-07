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
