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

    // Use lean() for better performance and reduce populate operations
    let sessions = await Session.find(query)
      .lean(true) // Use lean for better performance
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
      .populate({
        path: 'rejectedBy',
        select: 'firstName lastName email avatar'
      })
      .sort({ createdAt: -1 });

    // Optional: Fix data consistency in background (don't block response)
    // This runs asynchronously after the response is sent
    setImmediate(async () => {
      try {
        const sessionsToUpdate = await Session.find(query).lean(false);
        const bulkOperations = [];
        
        for (let session of sessionsToUpdate) {
          let newStatus = session.status;
          
          // Don't change completed or canceled sessions
          if (session.status === 'completed' || session.status === 'canceled') {
            continue;
          }
          
          if (session.isAccepted === true && session.status !== 'active') {
            newStatus = 'active';
          } else if (session.isAccepted === false && session.status !== 'rejected') {
            newStatus = 'rejected';
          } else if (session.isAccepted === null && session.status !== 'pending') {
            newStatus = 'pending';
          }
          
          if (newStatus !== session.status) {
            bulkOperations.push({
              updateOne: {
                filter: { _id: session._id },
                update: { $set: { status: newStatus } }
              }
            });
          }
        }
        
        if (bulkOperations.length > 0) {
          await Session.bulkWrite(bulkOperations);
          console.log(`Updated ${bulkOperations.length} session statuses in background`);
        }
      } catch (error) {
        console.error('Background session status update error:', error);
      }
    });

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
