import { NextResponse } from "next/server";
import connect from "@/lib/db";
import ReportInSession from "@/lib/models/reportInSessionSchema";
import User from "@/lib/models/userSchema";
import Session from "@/lib/models/sessionSchema";
import { ReportEmailTemplates } from "@/lib/emailTemplates";
import { Types } from "mongoose";

/**
 * POST /api/admin/reports/[reportId]/notify
 * Generate email templates for the frontend to use with mailto links
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    await connect();

    const { reportId } = await params;

    // Validate reportId
    if (!reportId || !Types.ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { success: false, message: "Invalid report ID" },
        { status: 400 }
      );
    }

    // Ensure all models are registered by importing them
    // This fixes the schema registration issue
    const userModel = User;
    const sessionModel = Session;
    const reportModel = ReportInSession;

    // Find the report with populated user data
    const report = await reportModel
      .findById(reportId)
      .populate("reportedBy", "firstName lastName email")
      .populate("reportedUser", "firstName lastName email")
      .populate("sessionId", "descriptionOfService1 descriptionOfService2");

    if (!report) {
      return NextResponse.json(
        { success: false, message: "Report not found" },
        { status: 404 }
      );
    }

    // Check if emails have already been sent
    if (report.status === "under_review" || report.status === "resolved") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Investigation emails have already been sent for this report",
        },
        { status: 400 }
      );
    }

    // Validate that both users have email addresses
    if (!report.reportedBy?.email || !report.reportedUser?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to send emails: Missing user email addresses",
        },
        { status: 400 }
      );
    }

    // Create session title
    const sessionTitle =
      report.sessionId?.descriptionOfService1 &&
      report.sessionId?.descriptionOfService2
        ? `${report.sessionId.descriptionOfService1} ↔ ${report.sessionId.descriptionOfService2}`
        : `Session ${report.sessionId?._id?.toString().slice(-8) || "Unknown"}`;

    // Prepare email data
    const emailData = {
      reportedUser: {
        firstName: report.reportedUser.firstName,
        lastName: report.reportedUser.lastName,
        email: report.reportedUser.email,
      },
      reportingUser: {
        firstName: report.reportedBy.firstName,
        lastName: report.reportedBy.lastName,
        email: report.reportedBy.email,
      },
      report: report,
      reportId: reportId,
      sessionTitle: sessionTitle,
    };

    // Get email templates
    const reportedUserEmail =
      ReportEmailTemplates.getReportedUserEmail(emailData);
    const reportingUserEmail =
      ReportEmailTemplates.getReportingUserEmail(emailData);

    // Update report status to under_review and add timestamp
    await ReportInSession.findByIdAndUpdate(reportId, {
      status: "under_review",
      investigationStartedAt: new Date(),
      emailsSentAt: new Date(),
    });

    // Return the email templates for the frontend to use with mailto links
    return NextResponse.json(
      {
        success: true,
        message: "Email templates generated for frontend mailto links",
        emailData: {
          reportedUser: {
            to: report.reportedUser.email,
            subject: reportedUserEmail.subject,
            body: reportedUserEmail.text || reportedUserEmail.html,
          },
          reportingUser: {
            to: report.reportedBy.email,
            subject: reportingUserEmail.subject,
            body: reportingUserEmail.text || reportingUserEmail.html,
          },
        },
        reportStatus: "under_review",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in report notification endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while generating email templates",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
