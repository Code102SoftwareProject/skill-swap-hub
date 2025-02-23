import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Session from "@/lib/models/sessionSchema";

export async function POST(req:Request){
    await connect();
    const body = await req.json();
    const { user1Id, skill1Id, descriptionOfService1, descriptionOfService2, user2Id, skill2Id, startDate, dueDate, isAccepted, isAmmended, status } = body;
    const session = new Session({
        user1Id,
        skill1Id,
        descriptionOfService1,
        descriptionOfService2,
        user2Id,
        skill2Id,
        startDate,
        dueDate,
        isAccepted,
        isAmmended,
        status
    });
    await session.save();
    return NextResponse.json({ session },{status:201});
}