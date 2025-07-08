import nodemailer from "nodemailer";

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // e.g. support@example.com
    pass: process.env.GMAIL_PASS, // Gmail App Password or OAuth2 token
  },
});

interface Report {
  _id: string;
  sessionId: any;
  reportedBy: any;
  reportedUser: any;
  reason: string;
  description: string;
  adminResponse: string;
  createdAt: Date;
}

export async function sendReportEmails(
  report: Report,
  action: "warn" | "suspend",
  adminMessage: string
): Promise<void> {
  try {
    const reportedUserEmail = report.reportedUser.email;
    const reportedUserName = `${report.reportedUser.firstName} ${report.reportedUser.lastName}`;

    const reportingUserEmail = report.reportedBy.email;
    const reportingUserName = `${report.reportedBy.firstName} ${report.reportedBy.lastName}`;

    // Email to the reported user
    const reportedUserSubject =
      action === "suspend"
        ? "Account Suspension Notice - Skill Swap Hub"
        : "Session Conduct Warning - Skill Swap Hub";

    const reportedUserBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Skill Swap Hub - ${action === "suspend" ? "Account Suspension" : "Conduct Warning"}</h2>
        
        <p>Dear ${reportedUserName},</p>
        
        <p>We have completed our review of a report filed against your account regarding session conduct.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #${action === "suspend" ? "dc3545" : "ffc107"}; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #${action === "suspend" ? "dc3545" : "ffc107"};">
            ${action === "suspend" ? "Account Suspended" : "Official Warning"}
          </h3>
          <p><strong>Report Reason:</strong> ${report.reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</p>
          <p><strong>Admin Response:</strong> ${adminMessage}</p>
          <p><strong>Report Date:</strong> ${new Date(report.createdAt).toLocaleDateString()}</p>
        </div>
        
        ${
          action === "suspend"
            ? `<p><strong>Your account has been suspended.</strong> You will not be able to access the platform until further notice. If you believe this action was taken in error, please contact our support team.</p>`
            : `<p><strong>This serves as an official warning.</strong> Please ensure your future interactions on the platform comply with our community guidelines. Repeated violations may result in account suspension.</p>`
        }
        
        <p>If you have any questions about this decision, please contact our support team.</p>
        
        <p>Best regards,<br>
        The Skill Swap Hub Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    // Email to the reporting user
    const reportingUserSubject = "Report Update - Skill Swap Hub";
    const reportingUserBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Skill Swap Hub - Report Update</h2>
        
        <p>Dear ${reportingUserName},</p>
        
        <p>Thank you for reporting a session conduct issue. We have completed our review and taken appropriate action.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #28a745;">Report Resolved</h3>
          <p><strong>Action Taken:</strong> ${action === "suspend" ? "Account Suspended" : "Official Warning Issued"}</p>
          <p><strong>Your Report:</strong> ${report.reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</p>
          <p><strong>Report Date:</strong> ${new Date(report.createdAt).toLocaleDateString()}</p>
        </div>
        
        <p>We take all reports seriously and appreciate your help in maintaining a safe and respectful community. Your report has been thoroughly reviewed and appropriate action has been taken.</p>
        
        <p>Thank you for using Skill Swap Hub responsibly.</p>
        
        <p>Best regards,<br>
        The Skill Swap Hub Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    // Send emails
    await Promise.all([
      transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: reportedUserEmail,
        subject: reportedUserSubject,
        html: reportedUserBody,
      }),
      transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: reportingUserEmail,
        subject: reportingUserSubject,
        html: reportingUserBody,
      }),
    ]);

    console.log(`Report emails sent successfully for report ${report._id}`);
  } catch (error) {
    console.error("Error sending report emails:", error);
    throw error;
  }
}

// Test email configuration
export async function testEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("Email configuration is valid");
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}
