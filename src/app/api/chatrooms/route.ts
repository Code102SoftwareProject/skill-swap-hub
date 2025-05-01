import { NextResponse, NextRequest } from 'next/server';
import connect from '@/lib/db';
import ChatRoom from '@/lib/models/chatRoomSchema';
import mongoose from 'mongoose';
import { systemApiAuth } from '@/lib/middleware/systemApiAuth';
import { requireSystemApiKey } from '@/lib/sytemApiUtil';
/**
 ** GET handler - Retrieves chat rooms
 * 
 * @param req Ex: GET /api/chatrooms?userId=64a82d9b5e211c2a400e30d5
 *            Can be called without userId to get all chat rooms
 * @returns JSON response with chat rooms array
 *          Success: { success: true, chatRooms: [...chatRoomObjects] }
 *          Error: { success: false, message: "Error message" }
 */
export async function GET(req: NextRequest) {
  // For system APIs, check the x-api-key header
  const apiKey = req.headers.get('x-api-key');
  
  // If API key is provided, validate it
  if (apiKey) {
    const response = await systemApiAuth(req);
    if (response.status === 401) {
      return response; // Return unauthorized if invalid API key
    }
  } else {
    // For user APIs, JWT auth is already handled by your middleware
    // You could add additional user-specific checks here if needed
  }
  
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    console.log('Received userId:', userId); // Debug log

    let query = {};
    if (userId) {
      // Convert string to ObjectId
      const userObjectId = new mongoose.Types.ObjectId(userId);
      query = { participants: userObjectId };
    }

    const chatRooms = await ChatRoom.find(query);
    console.log('Found chat rooms:', chatRooms); // Debug log
    
    return NextResponse.json({ success: true, chatRooms }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET chatrooms:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 **  POST handler - Creates a new chat room or returns existing one
 * 
 * @param req -JSON body containing participants array
 *             Ex body: { "participants": ["64a82d9b5e211c2a400e30d5", "64a82db15e211c2a400e30d8"] }
 *             Participants must be valid MongoDB ObjectIds or their string representations
 * @returns JSON response with chat room object
 *          New room: { success: true, chatRoom: {...} } with 201 status
 *          Existing room: { success: true, chatRoom: {...} } with 200 status
 *          Error: { success: false, message: "Error message" }
 */
export async function POST(req: NextRequest) {
  // System-only API calls must have API key
    
  requireSystemApiKey(req); // Ensure the request has a valid API key
  
  // Validate the API key
  const response = await systemApiAuth(req);
  if (response.status === 401) {
    return response;
  }

  await connect();

  try {
    const body = await req.json();
    let { participants } = body;

    // Must have exactly 2 participants
    if (!participants || participants.length !== 2) {
      return NextResponse.json(
        { success: false, message: 'A chat room must have exactly two participants' },
        { status: 400 }
      );
    }

    // Convert to ObjectIds if they aren't already
    const participantIds: mongoose.Types.ObjectId[] = participants.map((id: string | mongoose.Types.ObjectId) => 
      typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
    );
    
    // Sort participants to ensure consistent order
    participantIds.sort((a, b) => a.toString().localeCompare(b.toString()));
    
    // Check if a room with these same two participants already exists
    const existingRoom = await ChatRoom.findOne({
      $and: [
        { participants: { $elemMatch: { $eq: participantIds[0] } } },
        { participants: { $elemMatch: { $eq: participantIds[1] } } },
        { $expr: { $eq: [{ $size: "$participants" }, 2] } }
      ]
    });

    if (existingRoom) {
      // If it exists, return the existing room
      return NextResponse.json({ success: true, chatRoom: existingRoom }, { status: 200 });
    }

    // Create a new chat room with sorted participant IDs
    const chatRoom = await ChatRoom.create({ participants: participantIds });

    return NextResponse.json({ success: true, chatRoom }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 ** DELETE handler - Removes a chat room by ID
 * 
 * @param req Example: DELETE /api/chatrooms?roomId=64a82db85e211c2a400e30f1
 *            roomId must be a valid MongoDB ObjectId
 * @returns   Success: { success: true, message: "Room deleted successfully" }
 *            Not found: { success: false, message: "Room not Found" }
 *            Missing ID: { success: false, message: "Room ID is Required" }
 *            Error: { success: false, message: "Error message" }
 */
export async function DELETE(req: NextRequest) {  
  // System-only API calls must have API key
  const apiKey = req.headers.get('x-api-key');
  
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: 'API key required for this operation' },
      { status: 401 }
    );
  }
  
  // Validate the API key
  const response = await systemApiAuth(req);
  if (response.status === 401) {
    return response;
  }
  
  await connect();
  try{
    const {searchParams}=new URL(req.url)
    const roomId=searchParams.get('roomId')
    
    if(!roomId){
      return NextResponse.json({success:false, message:"Room ID is Required"},{status:400})
    }

    const result=await ChatRoom.deleteOne({_id:roomId});
    if(result.deletedCount===0){
      return NextResponse.json({success:false,message:"Room not Found"},{status:404})
    }
    
    return NextResponse.json({success:true, message:"Room deleted successfully"},{status:200})
  }catch(error: any){
    console.error('Error deleting chat room:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}