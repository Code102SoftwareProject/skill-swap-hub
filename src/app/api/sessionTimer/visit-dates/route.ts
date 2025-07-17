import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import SessionModel from "../../../../lib/models/sessionModel";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    await connect();

    // Aggregate total duration per day
    const results = await SessionModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            year: { $year: "$startTime" },
            month: { $month: "$startTime" },
            day: { $dayOfMonth: "$startTime" }
          },
          totalDuration: { $sum: "$duration" }
        }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day"
                }
              }
            }
          },
          duration: "$totalDuration"
        }
      },
      { $match: { duration: { $gte: 1800 } } }, // Only days with >= 30 min
      { $sort: { date: 1 } }
    ]);

    return NextResponse.json(results.map(r => ({
      date: r.date,
      duration: r.duration
    })));
  } catch (error) {
    console.error("Visit dates API error:", error);
    return NextResponse.json({ error: "Failed to fetch visit dates" }, { status: 500 });
  }
} 