import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Message from "@/lib/models/messageSchema";
import ChatRoom from "@/lib/models/chatRoomSchema";
import mongoose from "mongoose";

/**
 * GET handler for fetching unread message count per chat room for a user
 */
export async function GET(req: Request) {
  await connect();
  
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // First, find all chat rooms where the user is a participant
    const userChatRooms = await ChatRoom.find({
      participants: new mongoose.Types.ObjectId(userId)
    }).select('_id');

    const chatRoomIds = userChatRooms.map(room => room._id);

    // Aggregate unread messages by chat room
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          chatRoomId: { $in: chatRoomIds },
          senderId: { $ne: new mongoose.Types.ObjectId(userId) },
          readStatus: false
        }
      },
      {
        $group: {
          _id: "$chatRoomId",
          unreadCount: { $sum: 1 }
        }
      }
    ]);

    // Convert to a more convenient format: { chatRoomId: count }
    const unreadCountsMap: { [key: string]: number } = {};
    unreadCounts.forEach(({ _id, unreadCount }) => {
      unreadCountsMap[_id.toString()] = unreadCount;
    });

    return NextResponse.json(
      { 
        success: true, 
        unreadCounts: unreadCountsMap 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching unread message counts by room:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
