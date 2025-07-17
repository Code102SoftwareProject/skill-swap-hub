import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ChatRoom from '@/lib/models/chatRoomSchema';
import Message from '@/lib/models/messageSchema';
import User from '@/lib/models/userSchema';
import { Types } from 'mongoose';

// GET - Get complete chat room data (room info, messages, participants) in a single request
export async function GET(req: Request) {
  await connect();
  
  try {
    const { searchParams } = new URL(req.url);
    const chatRoomId = searchParams.get('chatRoomId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!chatRoomId || !userId) {
      return NextResponse.json(
        { success: false, message: 'ChatRoomId and userId are required' },
        { status: 400 }
      );
    }

    // Use aggregation pipeline for optimal performance
    const roomData = await ChatRoom.aggregate([
      { $match: { _id: new Types.ObjectId(chatRoomId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participantDetails',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, avatar: 1, name: 1 } }
          ]
        }
      },
      {
        $project: {
          participants: 1,
          participantDetails: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ]);

    if (!roomData || roomData.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Chat room not found' },
        { status: 404 }
      );
    }

    const chatRoom = roomData[0];

    // Fetch messages with pagination and populate sender info
    const messages = await Message.find({ chatRoomId: new Types.ObjectId(chatRoomId) })
      .populate({
        path: 'senderId',
        select: 'firstName lastName email avatar'
      })
      .populate({
        path: 'replyFor',
        select: 'content senderId sentAt',
        populate: {
          path: 'senderId',
          select: 'firstName lastName email avatar'
        }
      })
      .sort({ sentAt: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Get unread message count for this user in this room
    const unreadCount = await Message.countDocuments({
      chatRoomId: new Types.ObjectId(chatRoomId),
      senderId: { $ne: new Types.ObjectId(userId) },
      readStatus: { $ne: true }
    });

    // Create participant map for easy lookup
    const participantMap: { [key: string]: any } = {};
    chatRoom.participantDetails.forEach((participant: any) => {
      participantMap[participant._id.toString()] = {
        id: participant._id.toString(),
        name: participant.firstName && participant.lastName 
          ? `${participant.firstName} ${participant.lastName}`
          : participant.name || participant.email || 'Unknown User',
        firstName: participant.firstName,
        lastName: participant.lastName,
        avatar: participant.avatar,
        email: participant.email
      };
    });

    // Get the other participant (not the current user)
    const otherParticipant = chatRoom.participants.find(
      (p: any) => p.toString() !== userId
    );
    const otherParticipantInfo = otherParticipant ? participantMap[otherParticipant.toString()] : null;

    return NextResponse.json({
      success: true,
      data: {
        chatRoom: {
          _id: chatRoom._id,
          participants: chatRoom.participants,
          createdAt: chatRoom.createdAt,
          updatedAt: chatRoom.updatedAt
        },
        messages,
        participantMap,
        otherParticipant: otherParticipantInfo,
        unreadCount,
        totalMessages: messages.length
      }
    });

  } catch (error: any) {
    console.error('Chat room data API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Mark messages as read (optimized bulk operation)
export async function PATCH(req: Request) {
  await connect();
  
  try {
    const { chatRoomId, userId } = await req.json();

    if (!chatRoomId || !userId) {
      return NextResponse.json(
        { success: false, message: 'ChatRoomId and userId are required' },
        { status: 400 }
      );
    }

    // Bulk update unread messages in this chat room
    const result = await Message.updateMany(
      {
        chatRoomId: new Types.ObjectId(chatRoomId),
        senderId: { $ne: new Types.ObjectId(userId) },
        readStatus: { $ne: true }
      },
      {
        $set: { readStatus: true }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`,
      modifiedCount: result.modifiedCount
    });

  } catch (error: any) {
    console.error('Mark messages as read API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
