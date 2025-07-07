import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import ReportInSession from "@/lib/models/reportInSessionSchema";
import { Types } from "mongoose";

// GET /api/admin/reports/[id] - Get single report with full details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid report ID" },
        { status: 400 }
      );
    }

    const report = await ReportInSession.findById(id)
      .populate("reportedBy", "firstName lastName email phone title avatar")
      .populate(
        "reportedUser",
        "firstName lastName email phone title avatar suspension"
      )
      .populate(
        "sessionId",
        "startDate status user1Id user2Id skill1Id skill2Id descriptionOfService1 descriptionOfService2"
      )
      .populate("adminId", "firstName lastName email");

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found" },
        { status: 404 }
      );
    }

    // Update status from pending to under_review when first admin opens it
    if (report.status === "pending") {
      await ReportInSession.findByIdAndUpdate(id, {
        status: "under_review",
        updatedAt: new Date(),
      });

      // Update the report object for response
      report.status = "under_review";
      report.updatedAt = new Date();
    }

    return NextResponse.json({
      success: true,
      data: { report },
    });
  } catch (error: any) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch report",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
