import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import ReportInSession from "@/lib/models/reportInSessionSchema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // Connect to database
    await connect();

    const { reportId } = await params;
    const { resolution } = await request.json();

    // Validate the resolution type
    const validResolutions = [
      "mark_resolved",
      "warn_reported",
      "warn_reporter",
      "dismiss",
    ];
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        { error: "Invalid resolution type" },
        { status: 400 }
      );
    }

    // Find the report
    const report = await ReportInSession.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update the report status
    const updateData: any = {
      status: "resolved",
      resolvedAt: new Date(),
      updatedAt: new Date(),
    };

    // Add admin response based on resolution type
    switch (resolution) {
      case "mark_resolved":
        updateData.adminResponse =
          "Report has been marked as resolved by admin.";
        break;
      case "warn_reported":
        updateData.adminResponse =
          "Warning issued to reported user. Report resolved.";
        break;
      case "warn_reporter":
        updateData.adminResponse =
          "Warning issued to reporting user for false complaint. Report resolved.";
        break;
      case "dismiss":
        updateData.adminResponse = "Report dismissed - no action required.";
        break;
    }

    // Update the report
    const updatedReport = await ReportInSession.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    );

    if (!updatedReport) {
      return NextResponse.json(
        { error: "Failed to update report" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Report resolved successfully",
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error resolving report:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
