// File: src/app/api/matches/accept/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SkillMatch from '@/lib/models/skillMatch';
import ChatRoom from '@/lib/models/chatRoomSchema';
import mongoose from 'mongoose';

// Helper function to get user ID from the token
function getUserIdFromToken(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// POST - Accept match and create chat room
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }

    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({
        success: false,
        message: 'Match ID is required'
      }, { status: 400 });
    }

    await dbConnect();

    // Find the match
    const match = await SkillMatch.findById(matchId);

    if (!match) {
      return NextResponse.json({
        success: false,
        message: 'Match not found'
      }, { status: 404 });
    }

    // Verify that the user is part of this match
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'You do not have permission to accept this match'
      }, { status: 403 });
    }

    // Check if match is in pending status
    if (match.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: 'Match is not in pending status'
      }, { status: 400 });
    }

    // Update match status to accepted
    match.status = 'accepted';
    await match.save();

    // Get both user IDs for chat room creation
    const user1Id = match.userOneId;
    const user2Id = match.userTwoId;

    // Convert to ObjectIds for chat room
    const participantIds = [
      new mongoose.Types.ObjectId(user1Id),
      new mongoose.Types.ObjectId(user2Id)
    ].sort((a, b) => a.toString().localeCompare(b.toString()));

    // Check if a chat room already exists between these users
    const existingRoom = await ChatRoom.findOne({
      $and: [
        { participants: { $elemMatch: { $eq: participantIds[0] } } },
        { participants: { $elemMatch: { $eq: participantIds[1] } } },
        { $expr: { $eq: [{ $size: "$participants" }, 2] } }
      ]
    });

    let chatRoom;
    if (existingRoom) {
      chatRoom = existingRoom;
    } else {
      // Create new chat room
      chatRoom = await ChatRoom.create({ 
        participants: participantIds 
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Match accepted and chat room created successfully',
      data: {
        match: match,
        chatRoom: chatRoom,
        chatRoomExists: !!existingRoom
      }
    });

  } catch (error) {
    console.error('Error accepting match:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to accept match and create chat room' 
    }, { status: 500 });
  }
}