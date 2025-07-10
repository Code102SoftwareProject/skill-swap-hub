import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import ReportInSession from "@/lib/models/reportInSessionSchema";
import { Types } from "mongoose";

// POST /api/admin/reports/[reportId]/action - Take action on a report
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connect();

    const { reportId } = await params;

    if (!Types.ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { success: false, message: "Invalid report ID" },
        { status: 400 }
      );
    }

    const { action, adminId, notes } = await req.json();

    if (!action) {
      return NextResponse.json(
        { success: false, message: "Action is required" },
        { status: 400 }
      );
    }

    const report = await ReportInSession.findById(reportId);

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found" },
        { status: 404 }
      );
    }

    // Update the report with the action details
    const updatedReport = await ReportInSession.findByIdAndUpdate(
      reportId,
      {
        status: action,
        adminId,
        adminNotes: notes,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: { report: updatedReport },
    });
  } catch (error: any) {
    console.error("Error processing report action:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process report action",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
