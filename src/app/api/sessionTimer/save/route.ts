import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import SessionModel from "../../../../lib/models/sessionModel";

export async function POST(req: NextRequest) {
  try {
    const { userId, startTime, endTime, duration } = await req.json();
    if (!userId || !startTime || !endTime || typeof duration !== "number") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    await connect();
    await SessionModel.create({ userId, startTime, endTime, duration });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session save API error:", error);
    return NextResponse.json({ error: "Failed to save session data" }, { status: 500 });
  }
} 