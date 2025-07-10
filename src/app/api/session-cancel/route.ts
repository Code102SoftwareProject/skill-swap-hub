import { NextRequest,NextResponse } from "next/server";
import connect from "@/lib/db";
import SessionCancel from "@/lib/models/sessionCancelSchema";
import Session from "@/lib/models/sessionSchema"

export async function GET(req:NextRequest){
  try {
    // Connect to the database
    await connect();
    
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const initiatorId = searchParams.get('initiatorId');
    const resolution = searchParams.get('resolution');
    const responseStatus = searchParams.get('responseStatus');
    
    // Build query based on provided parameters
    const query: any = {};
    if (sessionId) query.sessionId = sessionId;
    if (initiatorId) query.initiatorId = initiatorId;
    if (resolution) query.resolution = resolution;
    if (responseStatus) query.responseStatus = responseStatus;
    
    // Fetch session cancellation requests
    const cancellationRequests = await SessionCancel.find(query)
      .populate('sessionId', 'title startDate endDate')
      .populate('initiatorId', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      data: cancellationRequests 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error in session cancellation GET:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to fetch session cancellation requests" 
    }, { status: 500 });
  }
}




export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connect();
    
    // Parse request body
    const body = await req.json();
    const {
      sessionId,
      initiatorId,
      reason,
      description,
      evidenceFiles
    } = body;
    
    // Validate required fields
    if (!sessionId || !initiatorId || !reason || !description) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }
    
    // Check if the session exists
    const sessionExists = await Session.findById(sessionId);
    if (!sessionExists) {
      return NextResponse.json({ 
        success: false, 
        error: "Session not found" 
      }, { status: 404 });
    }
    
    // Check if there's already a cancellation request for this session
    const existingRequest = await SessionCancel.findOne({ sessionId });
    if (existingRequest) {
      return NextResponse.json({ 
        success: false, 
        error: "A cancellation request already exists for this session" 
      }, { status: 409 });
    }
    
    // Create new cancellation request
    const newCancellationRequest = new SessionCancel({
      sessionId,
      initiatorId,
      reason,
      description,
      evidenceFiles: evidenceFiles || [],
      responseStatus: "pending",
      resolution: "pending"
    });
    
    // Save the request
    const savedRequest = await newCancellationRequest.save();
    
    // Update session status if needed
    // await Session.findByIdAndUpdate(sessionId, { status: "cancellation_requested" });
    
    return NextResponse.json({ 
      success: true, 
      message: "Cancellation request submitted successfully",
      data: savedRequest 
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error in session cancellation POST:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to create session cancellation request" 
    }, { status: 500 });
  }
}