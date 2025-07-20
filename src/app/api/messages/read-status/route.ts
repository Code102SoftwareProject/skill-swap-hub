import { NextResponse, NextRequest } from "next/server";
import connect from "@/lib/db";
import Message from "@/lib/models/messageSchema";
import mongoose from "mongoose";
import { validateAndExtractUserId } from "@/utils/jwtAuth";

/**
 * PATCH handler for bulk updating message read status
 */
export async function PATCH(req: NextRequest) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const tokenResult = validateAndExtractUserId(req);
    if (!tokenResult.isValid) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid or missing token" },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { messageIds } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Valid messageIds array is required" },
        { status: 400 }
      );
    }

    // Convert all IDs to ObjectId to ensure proper matching
    const objectIds = messageIds.map(id => new mongoose.Types.ObjectId(id));

    // Update all messages in a single operation
    const result = await Message.updateMany(
      { 
        _id: { $in: objectIds },
        readStatus: false  // Only update messages that are actually unread
      },
      { readStatus: true }
    );

    return NextResponse.json(
      { 
        success: true, 
        message: `${result.modifiedCount} messages marked as read`,
        modifiedCount: result.modifiedCount 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}