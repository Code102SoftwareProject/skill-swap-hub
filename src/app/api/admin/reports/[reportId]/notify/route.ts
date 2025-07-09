import { NextResponse } from "next/server";
import connect from "@/lib/db";
import ReportInSession from "@/lib/models/reportInSessionSchema";
import User from "@/lib/models/userSchema";
import Session from "@/lib/models/sessionSchema";
import EmailService from "@/lib/emailService";
import { ReportEmailTemplates } from "@/lib/emailTemplates";
import { Types } from "mongoose";

/**
 * POST /api/admin/reports/[reportId]/notify
 * Send investigation emails to both the reported user and reporting user
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

    // Initialize email service
    const emailService = new EmailService();

    // Verify email service connection (for testing, continue even if it fails)
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      console.log(
        "Email service not connected, but continuing for testing purposes"
      );
      // For testing purposes, we'll continue and simulate email sending
      // In production, you might want to fail here
    }

    const emailResults = [];

    // Send email to reported user
    try {
      const reportedUserEmail =
        ReportEmailTemplates.getReportedUserEmail(emailData);
      const reportedUserResult = await emailService.sendEmail({
        to: report.reportedUser.email,
        subject: reportedUserEmail.subject,
        html: reportedUserEmail.html,
        text: reportedUserEmail.text,
      });

      emailResults.push({
        recipient: "reported_user",
        email: report.reportedUser.email,
        sent: reportedUserResult,
      });
    } catch (error) {
      console.error("Error sending email to reported user:", error);
      emailResults.push({
        recipient: "reported_user",
        email: report.reportedUser.email,
        sent: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Send email to reporting user
    try {
      const reportingUserEmail =
        ReportEmailTemplates.getReportingUserEmail(emailData);
      const reportingUserResult = await emailService.sendEmail({
        to: report.reportedBy.email,
        subject: reportingUserEmail.subject,
        html: reportingUserEmail.html,
        text: reportingUserEmail.text,
      });

      emailResults.push({
        recipient: "reporting_user",
        email: report.reportedBy.email,
        sent: reportingUserResult,
      });
    } catch (error) {
      console.error("Error sending email to reporting user:", error);
      emailResults.push({
        recipient: "reporting_user",
        email: report.reportedBy.email,
        sent: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Check if at least one email was sent successfully
    const successfulEmails = emailResults.filter((result) => result.sent);

    if (successfulEmails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send any investigation emails",
          emailResults: emailResults,
        },
        { status: 500 }
      );
    }

    // Update report status to under_review and add timestamp
    await ReportInSession.findByIdAndUpdate(reportId, {
      status: "under_review",
      investigationStartedAt: new Date(),
      emailsSentAt: new Date(),
    });

    // Determine response message based on results
    let message;
    if (successfulEmails.length === 2) {
      message = "Investigation emails sent successfully to both users";
    } else {
      const failedEmails = emailResults.filter((result) => !result.sent);
      message = `Investigation emails partially sent. Failed to send to: ${failedEmails.map((r) => r.recipient).join(", ")}`;
    }

    return NextResponse.json(
      {
        success: true,
        message: message,
        emailResults: emailResults,
        reportStatus: "under_review",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in report notification endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while sending investigation emails",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
