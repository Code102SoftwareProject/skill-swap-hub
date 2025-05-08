import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Session from "@/lib/models/sessionSchema";
import SessionProgress from "@/lib/models/sessionProgressSchema";
import mongoose from "mongoose";

/**
 * Retrieves session progress for a specific user in a session
 * 
 * @param req - The HTTP request object with sessionId and userId as query parameters
 * @returns JSON response with the user's progress in the specified session
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');
    
    // Check if required parameters are provided
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        message: "Session ID is required"
      }, { status: 400 });
    }

    // Connect to database
    await connect();
    
    // Build query object
    const query: any = {
      sessionId: new mongoose.Types.ObjectId(sessionId)
    };
    
    // Add userId to query if provided
    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    // Find progress records
    const progressRecords = await SessionProgress.find(query)
      .populate('userId', 'name profileImage')
      .populate({
        path: 'sessionId',
        populate: [
          { path: 'skill1Id', select: 'name level' },
          { path: 'skill2Id', select: 'name level' },
          { path: 'user1Id', select: 'name profileImage' },
          { path: 'user2Id', select: 'name profileImage' }
        ]
      });

    if (progressRecords.length === 0) {
      return NextResponse.json({
        success: false,
        message: userId ? 
          "No progress found for this user in this session" : 
          "No progress records found for this session"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      progress: progressRecords,
      count: progressRecords.length
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching session progress:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch session progress",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Updates a session progress record
 * 
 * @param req - The HTTP request object with progressId as query parameter and update data in body
 * @returns JSON response with the updated progress record
 */
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const progressId = searchParams.get('progressId');
    
    // Check if progressId is provided
    if (!progressId) {
      return NextResponse.json({
        success: false,
        message: "Progress ID is required"
      }, { status: 400 });
    }

    // Validate progressId format
    if (!mongoose.isValidObjectId(progressId)) {
      return NextResponse.json({
        success: false,
        message: "Invalid progress ID format"
      }, { status: 400 });
    }

    // Get update data from request body
    const updateData = await req.json();
    
    // Connect to database
    await connect();
    
    // Validate update data
    const validUpdates: {
      completionPercentage?: number;
      status?: string;
      notes?: string;
      startDate?: Date;
      dueDate?: Date;
    } = {};
    
    // Validate completionPercentage if provided
    if (updateData.completionPercentage !== undefined) {
      const completion = Number(updateData.completionPercentage);
      if (isNaN(completion) || completion < 0 || completion > 100) {
        return NextResponse.json({
          success: false,
          message: "Completion percentage must be between 0 and 100"
        }, { status: 400 });
      }
      validUpdates['completionPercentage'] = completion;
    }
    
    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ["not_started", "in_progress", "completed", "abondoned"];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`
        }, { status: 400 });
      }
      validUpdates['status'] = updateData.status;
    }
    
    // Add other fields if provided
    if (updateData.notes !== undefined) validUpdates['notes'] = updateData.notes;
    if (updateData.startDate) validUpdates['startDate'] = new Date(updateData.startDate);
    if (updateData.dueDate) validUpdates['dueDate'] = new Date(updateData.dueDate);
    
    // If no valid updates provided
    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json({
        success: false,
        message: "No valid update data provided"
      }, { status: 400 });
    }
    
    // Update the progress record
    const updatedProgress = await SessionProgress.findByIdAndUpdate(
      progressId,
      { $set: validUpdates },
      { new: true, runValidators: true }
    );
    
    if (!updatedProgress) {
      return NextResponse.json({
        success: false,
        message: "Progress record not found"
      }, { status: 404 });
    }
    
    // If status is changed to completed, check if both users have completed
    if (validUpdates['status'] === "completed") {
      const sessionId = updatedProgress.sessionId;
      const allProgress = await SessionProgress.find({ sessionId });
      
      // If all progress records for this session are completed, update session status
      if (allProgress.length > 1 && allProgress.every(p => p.status === "completed")) {
        await Session.findByIdAndUpdate(
          sessionId,
          { $set: { status: "completed" } }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      progress: updatedProgress
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error updating session progress:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update session progress",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}