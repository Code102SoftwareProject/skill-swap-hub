import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ChatRoom from '@/lib/models/chatRoomSchema';
import mongoose from 'mongoose';

export async function GET(req: Request) {
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

//post to create a new chat room

export async function POST(req: Request) {
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

    // Ensure the participants are always stored in a sorted order
    participants.sort();

    // Check if a room with these two participants already exists
    const existingRoom = await ChatRoom.findOne({
      participants,
    });

    if (existingRoom) {
      // If it exists, return the existing room instead of creating a new one
      return NextResponse.json({ success: true, chatRoom: existingRoom }, { status: 200 });
    }

    // Otherwise, create a new chat room
    const chatRoom = await ChatRoom.create({ participants });

    return NextResponse.json({ success: true, chatRoom }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


//delete a chat room

export async function DELETE(req: Request) {  
  await connect();
  try{
    const {searchParams}=new URL(req.url)
    const roomId=searchParams.get('roomId')
    
    if(!roomId){
      return NextResponse.json({success:false,messsage:"Room ID is Required"},{status:400})
    }

    const result=await ChatRoom.deleteOne({_id:roomId});
    if(result.deletedCount===0){
      return NextResponse.json({success:false,message:"Room not Found"},{status:404})
    }
  }catch(error: any){

  }

}