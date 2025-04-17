import {NextResponse} from 'next/server';
import connect from '@/lib/db';
import OnlineLogSchema from '@/lib/models/onlineLogSchema';
import mongoose from 'mongoose';

export async function POST(req:Request) {
  await connect();
  try{
    const body = await req.json();
    const { userId } = body;
       
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing Required Fields" },
        { status: 400 }
      )
    }

    const OnlineLogId = new mongoose.Types.ObjectId(userId);

    // update or create if not there
    const result = await OnlineLogSchema.findOneAndUpdate(
      { userId: OnlineLogId },
      { lastOnline: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    )

  } catch(error:any) {
    return NextResponse.json(
      { success: false, message: error.message || "Server Error" },
      { status: 500 }
    )
  }
}


export async function GET(req: Request){
  await connect();
  try{
    const {searchParams} = new URL(req.url);
    const userId = searchParams.get('userId');

    if(!userId){
        return NextResponse.json(
            {success:false, message:"userId is Required"},
            {status:400}
        )
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await OnlineLogSchema.findOne({ userId: userObjectId });
    
    if (!result) {
      return NextResponse.json(
        { success: false, message: "No online log found for this user" },
        { status: 404 }
      );
    }
    // Extract the user
    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );

  } catch(error:any){
    return NextResponse.json(
      {success:false, message: error.message || "Server Error"},
      {status:500}
    )
  }
}