import sgMail from "@sendgrid/mail";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface ReportNotificationData {
  reporterEmail: string;
  reporterName: string;
  reportedEmail: string;
  reportedName: string;
  reason: string;
  sessionDetails: string;
  reportId: string;
  adminEmail?: string;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    const msg: sgMail.MailDataRequired = {
      to: emailData.to,
      from:
        process.env.SENDGRID_FROM_EMAIL ||
        process.env.GMAIL_USER ||
        "noreply@skillswaphub.com",
      subject: emailData.subject,
      text: emailData.text || "",
      html: emailData.html || emailData.text || "",
    };

    await sgMail.send(msg);
    console.log("Email sent successfully via SendGrid");
    return true;
  } catch (error) {
    console.error("SendGrid email error:", error);
    return false;
  }
}

export async function sendReportNotifications(
  data: ReportNotificationData
): Promise<{ success: boolean; message: string; results: any[] }> {
  const results: any[] = [];

  try {
    // Send notification to reporter
    const reporterEmailResult = await sendEmail({
      to: data.reporterEmail,
      subject: "Report Submitted - SkillSwap Hub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #609ad9;">Report Submitted Successfully</h2>
          <p>Dear ${data.reporterName},</p>
          <p>Thank you for reporting an issue. Your report has been submitted and is being reviewed by our team.</p>
          <p><strong>Report ID:</strong> ${data.reportId}</p>
          <p><strong>Session:</strong> ${data.sessionDetails}</p>
          <p><strong>Reason:</strong> ${formatReason(data.reason)}</p>
          <p>We will investigate this matter and take appropriate action if necessary.</p>
          <p>Best regards,<br>The SkillSwap Hub Team</p>
        </div>
      `,
    });

    results.push({
      type: "reporter_notification",
      success: reporterEmailResult,
      recipient: data.reporterEmail,
    });

    // Send notification to reported user
    const reportedEmailResult = await sendEmail({
      to: data.reportedEmail,
      subject: "Report Notification - SkillSwap Hub",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f39c12;">Report Notification</h2>
          <p>Dear ${data.reportedName},</p>
          <p>We have received a report regarding your activity on SkillSwap Hub.</p>
          <p><strong>Report ID:</strong> ${data.reportId}</p>
          <p><strong>Session:</strong> ${data.sessionDetails}</p>
          <p><strong>Reason:</strong> ${formatReason(data.reason)}</p>
          <p>Please review our community guidelines and ensure your future interactions follow our standards.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The SkillSwap Hub Team</p>
        </div>
      `,
    });

    results.push({
      type: "reported_user_notification",
      success: reportedEmailResult,
      recipient: data.reportedEmail,
    });

    // Send notification to admin if provided
    if (data.adminEmail) {
      const adminEmailResult = await sendEmail({
        to: data.adminEmail,
        subject: "New Report Submitted - SkillSwap Hub Admin",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #e74c3c;">New Report - Admin Notification</h2>
            <p><strong>Report ID:</strong> ${data.reportId}</p>
            <p><strong>Reporter:</strong> ${data.reporterName} (${data.reporterEmail})</p>
            <p><strong>Reported User:</strong> ${data.reportedName} (${data.reportedEmail})</p>
            <p><strong>Session:</strong> ${data.sessionDetails}</p>
            <p><strong>Reason:</strong> ${formatReason(data.reason)}</p>
            <p><strong>Priority:</strong> ${getEmailPriority(data.reason)}</p>
            <p>Please review and take appropriate action.</p>
          </div>
        `,
      });

      results.push({
        type: "admin_notification",
        success: adminEmailResult,
        recipient: data.adminEmail,
      });
    }

    const allSuccess = results.every((r) => r.success);

    return {
      success: allSuccess,
      message: allSuccess
        ? "All notifications sent successfully"
        : "Some notifications failed",
      results,
    };
  } catch (error) {
    console.error("Error sending report notifications:", error);
    return {
      success: false,
      message: "Failed to send report notifications",
      results,
    };
  }
}

// Helper functions
function formatReason(reason: string): string {
  const reasonMap: { [key: string]: string } = {
    inappropriate_behavior: "Inappropriate Behavior",
    poor_service: "Poor Service Quality",
    harassment: "Harassment",
    spam: "Spam",
    other: "Other",
  };
  return reasonMap[reason] || reason;
}

function formatSessionDetails(session: any): string {
  if (!session) return "N/A";
  return `${session.descriptionOfService1} ↔ ${session.descriptionOfService2}`;
}

function generateReportRef(reportId: string): string {
  return `REF-${reportId.slice(-8).toUpperCase()}`;
}

function getEmailPriority(reason: string): string {
  const priorities: { [key: string]: string } = {
    harassment: "HIGH",
    inappropriate_behavior: "MEDIUM",
    poor_service: "LOW",
    spam: "MEDIUM",
    other: "LOW",
  };
  return priorities[reason] || "LOW";
}

export const emailUtils = {
  formatReason,
  formatSessionDetails,
  generateReportRef,
  getEmailPriority,
  sendEmail,
  sendReportNotifications,
};
