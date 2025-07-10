import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import mongoose from 'mongoose';

// GET endpoint to retrieve session progress
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    const sessionId = url.searchParams.get('sessionId');
    const status = url.searchParams.get('status');
    
    await connect();
    
    // Build query based on provided parameters
    const query: any = {};
    if (id) query._id = id;
    if (userId) query.userId = userId;
    if (sessionId) query.sessionId = sessionId;
    if (status) query.status = status;
    
    const sessionProgress = Object.keys(query).length > 0 
      ? await SessionProgress.find(query)
      : await SessionProgress.find().limit(100); // Default limit
    
    return NextResponse.json(sessionProgress, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST endpoint to create new session progress
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    await connect();
    
    // Validate required fields
    if (!body.userId || !body.sessionId) {
      return NextResponse.json(
        { error: "userId and sessionId are required fields" },
        { status: 400 }
      );
    }
    
    const newSessionProgress = new SessionProgress(body);
    await newSessionProgress.save();
    
    return NextResponse.json(newSessionProgress, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PATCH endpoint to update existing session progress
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 }
      );
    }
    
    await connect();
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
    
    // Remove _id from update if present (can't update _id)
    if (body._id) {
      delete body._id;
    }
    
    const updatedSessionProgress = await SessionProgress.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    if (!updatedSessionProgress) {
      return NextResponse.json(
        { error: "Session progress not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedSessionProgress, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

