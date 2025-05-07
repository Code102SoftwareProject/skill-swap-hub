import { NextRequest, NextResponse } from "next/server";
import Session from "@/lib/models/sessionSchema";
import SessionProgress from "@/lib/models/sessionProgressSchema";
import connect from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connect();
    
    // Get the userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "userId is required" 
      }, { status: 400 });
    }
    
    // Find all sessions where the user is either user1 or user2
    const sessions = await Session.find({
      $or: [
        { user1Id: userId },
        { user2Id: userId }
      ]
    })
    .populate("progress1")
    .populate("progress2")
    .populate("skill1Id", "skillTitle categoryName")
    .populate("skill2Id", "skillTitle categoryName")
    .sort({ createdAt: -1 }); // Latest first
    
    return NextResponse.json({ 
      success: true, 
      sessions 
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    try {
      await connect();
    } catch (dbError: any) {
      // This likely won't happen since you're seeing "DB already connected"
      console.error("Database connection error:", dbError);
      return NextResponse.json({ 
        success: false, 
        error: "Database connection failed", 
        details: dbError.message 
      }, { status: 500 });
    }
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("Received request body:", JSON.stringify(body, null, 2));
    } catch (parseError: any) {
      console.error("Request parsing error:", parseError);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request format", 
        details: parseError.message 
      }, { status: 400 });
    }
    
    // Validate required fields and data types
    const {
      user1Id,
      skill1Id,
      descriptionOfService1,
      user2Id,
      skill2Id,
      descriptionOfService2,
      dueDateUser1,
      dueDateUser2,
    } = body;

    // Log all the extracted fields for debugging
    console.log("Extracted fields:", {
      user1Id,
      skill1Id,
      descriptionOfService1, 
      user2Id,
      skill2Id,
      descriptionOfService2,
      dueDateUser1,
      dueDateUser2
    });

    // Check for missing required fields
    const missingFields = [];
    if (!user1Id) missingFields.push('user1Id');
    if (!skill1Id) missingFields.push('skill1Id');
    if (!descriptionOfService1) missingFields.push('descriptionOfService1');
    if (!user2Id) missingFields.push('user2Id');
    if (!skill2Id) missingFields.push('skill2Id'); 
    if (!descriptionOfService2) missingFields.push('descriptionOfService2');
    if (!dueDateUser1) missingFields.push('dueDateUser1');
    if (!dueDateUser2) missingFields.push('dueDateUser2');
    
    if (missingFields.length > 0) {
      console.log("Missing fields detected:", missingFields);
      return NextResponse.json({
        success: false,
        error: "Missing required fields",
        missingFields,
        receivedData: body // Include the received data in the error
      }, { status: 400 });
    }

    const today = new Date();
    
    // Create the session
    let newSession;
    try {
      newSession = await Session.create({
        user1Id,
        skill1Id,
        descriptionOfService1,
        user2Id,
        skill2Id,
        descriptionOfService2,
        startDate: today,
        isAccepted: null,
        isAmmended: false,
        status: "active"
      });
    } catch (sessionError: any) {
      console.error("Session creation error:", sessionError);
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create session", 
        details: sessionError.message 
      }, { status: 500 });
    }
    
    // Create progress for user1
    let progress1;
    try {
      progress1 = await SessionProgress.create({
        userId: user1Id,
        sessionId: newSession._id,
        startDate: today,
        dueDate: new Date(dueDateUser1),
        completionPercentage: 0,
        status: "not_started"
      });
    } catch (progress1Error: any) {
      console.error("Progress1 creation error:", progress1Error);
      // Clean up the session we already created
      await Session.findByIdAndDelete(newSession._id);
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create progress for user1", 
        details: progress1Error.message 
      }, { status: 500 });
    }
    
    // Create progress for user2
    let progress2;
    try {
      progress2 = await SessionProgress.create({
        userId: user2Id,
        sessionId: newSession._id,
        startDate: today,
        dueDate: new Date(dueDateUser2),
        completionPercentage: 0,
        status: "not_started"
      });
    } catch (progress2Error: any) {
      console.error("Progress2 creation error:", progress2Error);
      // Clean up resources we already created
      await Session.findByIdAndDelete(newSession._id);
      await SessionProgress.findByIdAndDelete(progress1._id);
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create progress for user2", 
        details: progress2Error.message 
      }, { status: 500 });
    }
    
    // Update session with progress references
    let updatedSession;
    try {
      updatedSession = await Session.findByIdAndUpdate(
        newSession._id,
        {
          progress1: progress1._id,
          progress2: progress2._id
        },
        { new: true }
      );
    } catch (updateError: any) {
      console.error("Session update error:", updateError);
      // We'll still return success since the core resources were created
      // but with a warning that linking might have failed
      return NextResponse.json({ 
        success: true, 
        warning: "Session created but progress linking may have failed",
        details: updateError.message,
        session: newSession
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      session: updatedSession
    });
    
  } catch (error: any) {
    console.error("Unexpected error in POST /api/sessions:", error);
    return NextResponse.json({ 
      success: false, 
      error: "An unexpected error occurred", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}