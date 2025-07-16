import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connect from '@/lib/db';
import User from '@/lib/models/userSchema';
import UserSkill from '@/lib/models/userSkill';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import Session from '@/lib/models/sessionSchema';

// Ensure all models are registered
User;
UserSkill;
SessionProgress;
Session;

// GET - Get sessions between two specific users
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const user1Id = searchParams.get('user1Id');
    const user2Id = searchParams.get('user2Id');

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { success: false, message: 'Both user1Id and user2Id are required' },
        { status: 400 }
      );
    }

    // Find sessions between these two users (in either direction)
    const query = {
      $or: [
        { 
          user1Id: new Types.ObjectId(user1Id),
          user2Id: new Types.ObjectId(user2Id)
        },
        { 
          user1Id: new Types.ObjectId(user2Id),
          user2Id: new Types.ObjectId(user1Id)
        }
      ]
    };

    let sessions = await Session.find(query)
      .lean(false) // Ensure we get the latest data from database
      .populate({
        path: 'user1Id',
        select: 'firstName lastName email avatar'
      })
      .populate({
        path: 'user2Id', 
        select: 'firstName lastName email avatar'
      })
      .populate({
        path: 'skill1Id',
        select: 'skillTitle proficiencyLevel categoryName'
      })
      .populate({
        path: 'skill2Id',
        select: 'skillTitle proficiencyLevel categoryName'
      })
      .populate('progress1')
      .populate('progress2')
      .populate({
        path: 'rejectedBy',
        select: 'firstName lastName email avatar'
      })
      .sort({ createdAt: -1 });

    // Fix data consistency - preserve completed and canceled status
    for (let session of sessions) {
      let needsUpdate = false;
      
      // Don't change completed or canceled sessions
      if (session.status === 'completed' || session.status === 'canceled') {
        continue;
      }
      
      if (session.isAccepted === true && session.status !== 'active') {
        session.status = 'active';
        needsUpdate = true;
      } else if (session.isAccepted === false) {
        if (session.status !== 'rejected') {
          // Status should be rejected (not canceled)
          session.status = 'rejected';
          needsUpdate = true;
        }
      } else if (session.isAccepted === null && session.status !== 'pending') {
        session.status = 'pending';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await session.save();
        console.log(`Updated session ${session._id} status to ${session.status} (isAccepted: ${session.isAccepted})`);
      }
    }

    return NextResponse.json({
      success: true,
      sessions
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session between users API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
