import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Session from "@/lib/models/sessionSchema";
import SessionProgress from "@/lib/models/sessionProgressSchema";
import mongoose from "mongoose";

/**
 * Creates a new skill exchange session between two users
 * 
 * @param req - The HTTP request object containing session details in the body
 * @returns JSON response with the newly created session details
 */
export async function POST(req:Request){
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
      dueDateUser1,
      dueDateUser2,
    } = body;
    
    // Validate required fields
    if (!user1Id || !skill1Id || !descriptionOfService1 || 
        !user2Id || !skill2Id || !descriptionOfService2) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields" 
      }, { status: 400 });
    }
    
    // Connect to database
    await connect();
    
    // Create the new session
    const newSession = new Session({
      user1Id,
      skill1Id,
      descriptionOfService1,
      user2Id,
      skill2Id,
      descriptionOfService2,
      startDate,
      isAccepted: false,
      status: "active"
    });
    
    const savedSession = await newSession.save();
    
    const user1Progress = new SessionProgress({
      userId: user1Id,
      sessionId: savedSession._id,
      completionPercentage: 0,
      status: "not_started",
      
      dueDate:dueDateUser1
    });
    
    const user2Progress = new SessionProgress({
      userId: user2Id,
      sessionId: savedSession._id,
      completionPercentage: 0,
      status: "not_started",
      dueDate:dueDateUser2
    });
    
    const [savedProgress1, savedProgress2] = await Promise.all([
      user1Progress.save(),
      user2Progress.save()
    ]);
    
    savedSession.progress1 = savedProgress1._id;
    savedSession.progress2 = savedProgress2._id;
    await savedSession.save();
    
    return NextResponse.json({
      success: true,
      session: savedSession,
      progress: {
        user1: savedProgress1,
        user2: savedProgress2
      }
    }, { status: 201 });
    
  } catch(error) {
    console.error("Error creating session:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to create session",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Retrieves all sessions for a specific user
 * 
 * @param req - The HTTP request object with userId as query parameter
 * @returns JSON response with the user's sessions
 */
export async function GET(req: Request) {
  try {
    // Get the user ID from the URL query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    // Check if userId is provided
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User ID is required"
      }, { status: 400 });
    }

    // Connect to database
    await connect();

    // Ensure the userId is converted to a valid ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);

    // Find all sessions where the user ID matches either user1Id or user2Id
    const sessions = await Session.find({
      $or: [
        { user1Id: objectId },
        { user2Id: objectId }
      ]
    }).populate([
      { path: 'skill1Id', select: 'name level' },
      { path: 'skill2Id', select: 'name level' },
      { path: 'user1Id', select: 'name profileImage' },
      { path: 'user2Id', select: 'name profileImage' },
      { path: 'progress1', model: 'SessionProgress' },
      { path: 'progress2', model: 'SessionProgress' }
    ]);

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length
    }, { status: 200 });
    
  } catch(error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch sessions",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

