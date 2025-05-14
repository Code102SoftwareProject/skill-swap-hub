import { NextRequest,NextResponse } from "next/server";
import Session from "@/lib/models/sessionSchema";
import connect from "@/lib/db";


async function POST(req:Request){
  try{
    await connect();
    const body = await req.json();
    const { user1Id, skill1Id, descriptionOfService1, user2Id, skill2Id, descriptionOfService2, startDate } = body;
    const session = new Session({
      user1Id,
      skill1Id,
      descriptionOfService1,
      user2Id,
      skill2Id,
      descriptionOfService2,
      startDate,
      isAccepted: null,
      isAmmended: false,
      status: "pending",
    })
    const savedSession = await session.save();
    return NextResponse.json({
      success: true,
      message: "Session created successfully",
      session: savedSession,
    },{status: 201});
    

  }catch(error:any){
    return NextResponse.json({
      success: false,
      message: "Error creating session",
      error: error.message,
    },{status: 500});
  }
}