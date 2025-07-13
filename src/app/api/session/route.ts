import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Types } from 'mongoose';
import connect from '@/lib/db';
// Import models in the correct order to avoid schema registration issues
import User from '@/lib/models/userSchema';
import UserSkill from '@/lib/models/userSkill';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import Session from '@/lib/models/sessionSchema';

// GET - Get all sessions (with optional user filter)
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    console.log('Session API called with:', { userId, status, search });

    let query: any = {};
    
    // Filter by user if provided
    if (userId) {
      query = {
        $or: [
          { user1Id: new Types.ObjectId(userId) },
          { user2Id: new Types.ObjectId(userId) }
        ]
      };
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    // Ensure models are registered by accessing them
    console.log('User model exists:', !!User);
    console.log('UserSkill model exists:', !!UserSkill);
    console.log('SessionProgress model exists:', !!SessionProgress);

    // Try to populate step by step
    let sessions = await Session.find(query)
      .sort({ createdAt: -1 });

    console.log('Found sessions (unpopulated):', sessions.length);
    
    // Debug: Log the first session to see its structure
    if (sessions.length > 0) {
      console.log('Sample session data:', {
        isAccepted: sessions[0].isAccepted,
        status: sessions[0].status,
        user1Id: sessions[0].user1Id,
        user2Id: sessions[0].user2Id
      });
    }

    // Fix data consistency: ensure status matches isAccepted
    for (let session of sessions) {
      let needsUpdate = false;
      
      if (session.isAccepted === true && session.status !== 'active') {
        session.status = 'active';
        needsUpdate = true;
      } else if (session.isAccepted === false && session.status !== 'canceled') {
        session.status = 'canceled'; 
        needsUpdate = true;
      } else if (session.isAccepted === null && session.status !== 'pending') {
        session.status = 'pending';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await session.save();
        console.log(`Updated session ${session._id} status to ${session.status}`);
      }
    }

    // Now try to populate
    try {
      sessions = await Session.find(query)
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
        .sort({ createdAt: -1 });
      
      console.log('Successfully populated sessions');
    } catch (populateError) {
      console.error('Population failed:', populateError);
      // Return unpopulated sessions if population fails
      sessions = await Session.find(query).sort({ createdAt: -1 });
    }

    // Search functionality (only if we have populated data)
    if (search && sessions.length > 0 && sessions[0].user1Id?.firstName) {
      const searchLower = search.toLowerCase();
      sessions = sessions.filter(session => {
        const user1Name = `${session.user1Id.firstName || ''} ${session.user1Id.lastName || ''}`.toLowerCase();
        const user2Name = `${session.user2Id.firstName || ''} ${session.user2Id.lastName || ''}`.toLowerCase();
        const skill1Title = session.skill1Id?.skillTitle?.toLowerCase() || '';
        const skill2Title = session.skill2Id?.skillTitle?.toLowerCase() || '';
        
        return user1Name.includes(searchLower) || 
               user2Name.includes(searchLower) ||
               skill1Title.includes(searchLower) ||
               skill2Title.includes(searchLower);
      });
    }

    return NextResponse.json({
      success: true,
      sessions
    }, { status: 200 });

  } catch (error: any) {
    console.error('Session API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new session
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const {
      user1Id,
      skill1Id,
      descriptionOfService1,
      user2Id,
      skill2Id,
      descriptionOfService2,
      startDate,
      expectedEndDate
    } = body;

    // Validate required fields
    if (!user1Id || !skill1Id || !descriptionOfService1 || 
        !user2Id || !skill2Id || !descriptionOfService2 || !startDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sessionData: any = {
      user1Id: new Types.ObjectId(user1Id),
      skill1Id: new Types.ObjectId(skill1Id),
      descriptionOfService1,
      user2Id: new Types.ObjectId(user2Id),
      skill2Id: new Types.ObjectId(skill2Id),
      descriptionOfService2,
      startDate: new Date(startDate),
      isAccepted: null,
      isAmmended: false,
      status: 'pending'
    };

    // Add expected end date if provided
    if (expectedEndDate) {
      sessionData.expectedEndDate = new Date(expectedEndDate);
    }

    const session = await Session.create(sessionData);

    const populatedSession = await Session.findById(session._id)
      .populate('user1Id', 'email avatar firstName lastName')
      .populate('user2Id', 'email avatar firstName lastName')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName');

    return NextResponse.json({
      success: true,
      message: "Session created successfully",
      session: populatedSession
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error creating session",
        error: error.message
      },
      { status: 500 }
    );
  }
}

// PUT - Update session (accept/reject)
export async function PUT(req: NextRequest) {
  try {
    await connect();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const action = url.searchParams.get("action"); // accept or reject

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }

    if (!action || (action !== "accept" && action !== "reject")) {
      return NextResponse.json(
        { success: false, message: "Valid action (accept or reject) is required" },
        { status: 400 }
      );
    }

    // Find the session
    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404 }
      );
    }

    // Process based on action parameter
    if (action === "accept") {
      // Handle acceptance
      session.isAccepted = true;
      session.status = "active";

      // Create progress documents for both users
      const progress1 = new SessionProgress({
        userId: session.user1Id,
        sessionId: session._id,
        status: "not_started",
        completionPercentage: 0,
        notes: ""
      });
      await progress1.save();

      const progress2 = new SessionProgress({
        userId: session.user2Id,
        sessionId: session._id,
        status: "not_started",
        completionPercentage: 0,
        notes: ""
      });
      await progress2.save();

      // Link progress documents to session
      session.progress1 = progress1._id;
      session.progress2 = progress2._id;
    } else {
      // Handle rejection
      session.isAccepted = false;
      session.status = "rejected";
    }

    // Save updated session
    await session.save();

    return NextResponse.json(
      {
        success: true,
        message: action === "accept" ? "Session accepted successfully" : "Session rejected",
        session,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Error updating session",
        error: error.message,
      },
      { status: 500 }
    );
  }
}