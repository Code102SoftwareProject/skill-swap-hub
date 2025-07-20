import { NextResponse } from "next/server";
import connect from "@/lib/db";
import ReportInSession from "@/lib/models/reportInSessionSchema";
import Session from "@/lib/models/sessionSchema";
import User from "@/lib/models/userSchema";

// GET - Get all reports for admin dashboard
export async function GET(req: Request) {
  await connect();
  try {
    console.log("Fetching reports from database...");

    // First, let's check if there are any reports at all
    const totalReports = await ReportInSession.countDocuments();
    console.log("Total reports in database:", totalReports);

    if (totalReports === 0) {
      console.log("No reports found in database");
      return NextResponse.json([], { status: 200 });
    }

    // Check if we can fetch without population first
    const reportsBasic = await ReportInSession.find({}).limit(1).lean();
    console.log(
      "Basic report sample:",
      JSON.stringify(reportsBasic[0], null, 2)
    );

    const reports = await ReportInSession.find({})
      .populate({
        path: "reportedBy",
        select: "firstName lastName email",
        model: "User",
      })
      .populate({
        path: "reportedUser",
        select: "firstName lastName email",
        model: "User",
      })
      .populate({
        path: "sessionId",
        select:
          "_id user1Id user2Id skill1Id skill2Id descriptionOfService1 descriptionOfService2 startDate status",
        model: "Session",
      })
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    console.log("Found reports:", reports.length);
    if (reports.length > 0) {
      console.log(
        "Sample populated report:",
        JSON.stringify(reports[0], null, 2)
      );
      console.log("Report user details:", {
        reportedBy: reports[0].reportedBy,
        reportedUser: reports[0].reportedUser,
        session: reports[0].sessionId,
      });
    }

    return NextResponse.json(reports, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json(
      { message: "Error fetching reports", error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a test report (for testing purposes)
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();

    // If no body provided, create a test report
    if (!body.sessionId) {
      // First check if there are any users and sessions to reference
      const users = await User.find({}).limit(2);
      const sessions = await Session.find({}).limit(1);

      if (users.length < 2) {
        return NextResponse.json(
          {
            message: "Need at least 2 users in database to create test report",
          },
          { status: 400 }
        );
      }

      if (sessions.length === 0) {
        return NextResponse.json(
          {
            message:
              "Need at least 1 session in database to create test report",
          },
          { status: 400 }
        );
      }

      const testReport = new ReportInSession({
        sessionId: sessions[0]._id,
        reportedBy: users[0]._id,
        reportedUser: users[1]._id,
        reason: "inappropriate_behavior",
        description: "Test report for debugging purposes",
        status: "pending",
      });

      await testReport.save();

      const populatedReport = await ReportInSession.findById(testReport._id)
        .populate("reportedBy", "firstName lastName email")
        .populate("reportedUser", "firstName lastName email")
        .populate(
          "sessionId",
          "_id user1Id user2Id skill1Id skill2Id descriptionOfService1 descriptionOfService2 startDate status"
        );

      return NextResponse.json(
        {
          message: "Test report created",
          report: populatedReport,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    console.error("Error creating test report:", error);
    return NextResponse.json(
      { message: "Error creating test report", error: error.message },
      { status: 500 }
    );
  }
}
