import { NextResponse, NextRequest } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connect from '@/lib/db';
import User from '@/lib/models/userSchema';
import UserSkill from '@/lib/models/userSkill';
import Session from '@/lib/models/sessionSchema';
import SessionCounterOffer from '@/lib/models/sessionCounterOfferSchema';
import { validateAndExtractUserId } from '@/utils/jwtAuth';

// Ensure all models are registered
User;
UserSkill;
Session;
SessionCounterOffer;

// GET - Get sessions between two specific users with counter offers included
export async function GET(req: NextRequest) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        message: authResult.error
      }, { status: 401 });
    }
    
    const authenticatedUserId = authResult.userId!;
    
    const { searchParams } = new URL(req.url);
    const user1Id = searchParams.get('user1Id');
    const user2Id = searchParams.get('user2Id');

    if (!user1Id || !user2Id) {
      return NextResponse.json(
        { success: false, message: 'Both user1Id and user2Id are required' },
        { status: 400 }
      );
    }

    // Validate that the authenticated user is one of the users in the request
    if (user1Id !== authenticatedUserId && user2Id !== authenticatedUserId) {
      return NextResponse.json({
        success: false,
        message: "Forbidden: You can only access sessions you are involved in"
      }, { status: 403 });
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

    // Use aggregation pipeline for better performance
    const sessionsWithOffers = await Session.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'user1Id',
          foreignField: '_id',
          as: 'user1Id',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, avatar: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user2Id',
          foreignField: '_id',
          as: 'user2Id',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, avatar: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'userskills',
          localField: 'skill1Id',
          foreignField: '_id',
          as: 'skill1Id',
          pipeline: [
            { $project: { skillTitle: 1, proficiencyLevel: 1, categoryName: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'userskills',
          localField: 'skill2Id',
          foreignField: '_id',
          as: 'skill2Id',
          pipeline: [
            { $project: { skillTitle: 1, proficiencyLevel: 1, categoryName: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'rejectedBy',
          foreignField: '_id',
          as: 'rejectedBy',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, avatar: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'sessioncounteroffers',
          localField: '_id',
          foreignField: 'originalSessionId',
          as: 'counterOffers',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'counterOfferedBy',
                foreignField: '_id',
                as: 'counterOfferedBy',
                pipeline: [
                  { $project: { firstName: 1, lastName: 1, email: 1, avatar: 1 } }
                ]
              }
            },
            {
              $lookup: {
                from: 'userskills',
                localField: 'skill1Id',
                foreignField: '_id',
                as: 'skill1Id',
                pipeline: [
                  { $project: { skillTitle: 1, proficiencyLevel: 1, categoryName: 1 } }
                ]
              }
            },
            {
              $lookup: {
                from: 'userskills',
                localField: 'skill2Id',
                foreignField: '_id',
                as: 'skill2Id',
                pipeline: [
                  { $project: { skillTitle: 1, proficiencyLevel: 1, categoryName: 1 } }
                ]
              }
            },
            { $unwind: { path: '$counterOfferedBy', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$skill1Id', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$skill2Id', preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
          ]
        }
      },
      { $unwind: { path: '$user1Id', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$user2Id', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$skill1Id', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$skill2Id', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } }
    ]);

    // Process sessions to ensure correct status
    const processedSessions = sessionsWithOffers.map(session => {
      let status = session.status;
      
      // Fix status based on isAccepted field (but don't modify completed/canceled)
      if (status !== 'completed' && status !== 'canceled') {
        if (session.isAccepted === true && status !== 'active') {
          status = 'active';
        } else if (session.isAccepted === false && status !== 'rejected') {
          status = 'rejected';
        } else if (session.isAccepted === null && status !== 'pending') {
          status = 'pending';
        }
      }
      
      return {
        ...session,
        status
      };
    });

    // Create counter offers map for easy access
    const counterOffersMap: { [sessionId: string]: any[] } = {};
    processedSessions.forEach(session => {
      counterOffersMap[session._id.toString()] = session.counterOffers || [];
    });

    return NextResponse.json({
      success: true,
      sessions: processedSessions,
      counterOffers: counterOffersMap
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session between users with offers API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
