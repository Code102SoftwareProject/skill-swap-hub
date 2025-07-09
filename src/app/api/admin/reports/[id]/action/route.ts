import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import ReportInSession from "@/lib/models/reportInSessionSchema";
import User from "@/lib/models/userSchema";
import { Types } from "mongoose";
import { sendReportEmails } from "@/lib/emailService";

// PATCH /api/admin/reports/[id]/action - Resolve report with action
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();

    const { id } = await params;
    const body = await req.json();
    const { action, adminMessage, adminId } = body;

    // Validate input
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid report ID" },
        { status: 400 }
      );
    }

    if (!action || !["warn", "suspend"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid action. Must be "warn" or "suspend"',
        },
        { status: 400 }
      );
    }

    if (
      !adminMessage ||
      typeof adminMessage !== "string" ||
      adminMessage.trim().length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Admin message is required" },
        { status: 400 }
      );
    }

    if (adminMessage.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin message must be 1000 characters or less",
        },
        { status: 400 }
      );
    }

    if (!adminId || !Types.ObjectId.isValid(adminId)) {
      return NextResponse.json(
        { success: false, message: "Valid admin ID is required" },
        { status: 400 }
      );
    }

    // Start transaction
    const session = await ReportInSession.startSession();
    session.startTransaction();

    try {
      // Find the report
      const report = await ReportInSession.findById(id)
        .populate("reportedBy", "firstName lastName email")
        .populate("reportedUser", "firstName lastName email")
        .populate("sessionId")
        .session(session);

      if (!report) {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Report not found" },
          { status: 404 }
        );
      }

      if (report.status === "resolved") {
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, message: "Report has already been resolved" },
          { status: 400 }
        );
      }

      // Update the report
      const updatedReport = await ReportInSession.findByIdAndUpdate(
        id,
        {
          status: "resolved",
          adminResponse: adminMessage.trim(),
          adminId: new Types.ObjectId(adminId),
          resolvedAt: new Date(),
        },
        { new: true, session }
      )
        .populate("reportedBy", "firstName lastName email")
        .populate("reportedUser", "firstName lastName email");

      // If action is suspend, update the user
      if (action === "suspend") {
        await User.findByIdAndUpdate(
          report.reportedUser._id,
          {
            "suspension.isSuspended": true,
            "suspension.suspendedAt": new Date(),
            "suspension.reason": adminMessage.trim(),
          },
          { session }
        );
      }

      // Commit transaction
      await session.commitTransaction();

      // Send emails (outside of transaction)
      try {
        await sendReportEmails(updatedReport, action, adminMessage.trim());
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
        // Don't fail the entire operation if emails fail
      }

      return NextResponse.json({
        success: true,
        message: `Report resolved with ${action} action`,
        data: { report: updatedReport },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error("Error resolving report:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to resolve report",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
