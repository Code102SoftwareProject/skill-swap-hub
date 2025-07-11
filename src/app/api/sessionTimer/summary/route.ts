import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import SessionModel from "../../../../lib/models/sessionModel";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const range = searchParams.get("range") || "day";
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    await connect();
    let groupId: any = {};
    if (range === "day") {
      groupId = { year: { $year: "$startTime" }, month: { $month: "$startTime" }, day: { $dayOfMonth: "$startTime" } };
    } else if (range === "week") {
      groupId = { year: { $year: "$startTime" }, week: { $isoWeek: "$startTime" } };
    } else if (range === "month") {
      groupId = { year: { $year: "$startTime" }, month: { $month: "$startTime" } };
    }
    const summary = await SessionModel.aggregate([
      { $match: { userId } },
      { $group: { _id: groupId, totalDuration: { $sum: "$duration" } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
    ]);
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: "Failed to aggregate session data" }, { status: 500 });
  }
} 