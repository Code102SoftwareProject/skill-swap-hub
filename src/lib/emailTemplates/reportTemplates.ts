interface EmailData {
  reportedUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reportingUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  report: any;
  reportId: string;
  sessionTitle: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class ReportEmailTemplates {
  /**
   * Generates an email template for the reported user
   */
  static getReportedUserEmail(data: EmailData): EmailTemplate {
    const fullName = `${data.reportedUser.firstName} ${data.reportedUser.lastName}`;

    return {
      subject: `[SkillSwap Hub] Important: Your Session Has Been Reported`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://skillswaphub.com/logo.png" alt="SkillSwap Hub Logo" style="max-width: 150px;">
  </div>
  
  <h2 style="color: #333; text-align: center;">Important Notice Regarding Your Session</h2>
  
  <p>Dear ${fullName},</p>
  
  <p>We are writing to inform you that a report has been filed regarding your session: <strong>${data.sessionTitle}</strong>.</p>
  
  <p>At SkillSwap Hub, we take all reports seriously to maintain a safe and respectful environment for all users. Our admin team is currently reviewing the report and will be in touch if any action is required.</p>
  
  <p><strong>What happens next?</strong></p>
  <ul>
    <li>Our team will review the report thoroughly</li>
    <li>We may contact you for additional information</li>
    <li>No immediate action is required from you at this time</li>
  </ul>
  
  <p>If you believe this report was made in error or would like to provide any context, please reply to this email with your perspective.</p>
  
  <p>Thank you for your understanding and cooperation.</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
    <p>Best regards,<br>
    The SkillSwap Hub Admin Team</p>
    
    <p style="color: #999;">Reference: Report ID ${data.reportId}</p>
  </div>
</div>
      `,
      text: `
Important Notice Regarding Your Session

Dear ${fullName},

We are writing to inform you that a report has been filed regarding your session: ${data.sessionTitle}.

At SkillSwap Hub, we take all reports seriously to maintain a safe and respectful environment for all users. Our admin team is currently reviewing the report and will be in touch if any action is required.

What happens next?
- Our team will review the report thoroughly
- We may contact you for additional information
- No immediate action is required from you at this time

If you believe this report was made in error or would like to provide any context, please reply to this email with your perspective.

Thank you for your understanding and cooperation.

Best regards,
The SkillSwap Hub Admin Team

Reference: Report ID ${data.reportId}
      `,
    };
  }

  /**
   * Generates an email template for the reporting user
   */
  static getReportingUserEmail(data: EmailData): EmailTemplate {
    const fullName = `${data.reportingUser.firstName} ${data.reportingUser.lastName}`;

    return {
      subject: `[SkillSwap Hub] We've Received Your Report`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://skillswaphub.com/logo.png" alt="SkillSwap Hub Logo" style="max-width: 150px;">
  </div>
  
  <h2 style="color: #333; text-align: center;">Thank You for Your Report</h2>
  
  <p>Dear ${fullName},</p>
  
  <p>Thank you for submitting a report regarding the session: <strong>${data.sessionTitle}</strong>.</p>
  
  <p>We appreciate you taking the time to help keep SkillSwap Hub a safe and welcoming community. Your report has been received and is now under investigation by our admin team.</p>
  
  <p><strong>What happens next?</strong></p>
  <ul>
    <li>Our team will review the report thoroughly</li>
    <li>We will take appropriate action based on our findings</li>
    <li>We may contact you if we need additional information</li>
  </ul>
  
  <p>The reference number for your report is <strong>${data.reportId}</strong>. Please keep this for your records.</p>
  
  <p>Thank you again for helping us maintain community standards.</p>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; color: #666; font-size: 12px;">
    <p>Best regards,<br>
    The SkillSwap Hub Admin Team</p>
    
    <p style="color: #999;">Reference: Report ID ${data.reportId}</p>
  </div>
</div>
      `,
      text: `
Thank You for Your Report

Dear ${fullName},

Thank you for submitting a report regarding the session: ${data.sessionTitle}.

We appreciate you taking the time to help keep SkillSwap Hub a safe and welcoming community. Your report has been received and is now under investigation by our admin team.

What happens next?
- Our team will review the report thoroughly
- We will take appropriate action based on our findings
- We may contact you if we need additional information

The reference number for your report is ${data.reportId}. Please keep this for your records.

Thank you again for helping us maintain community standards.

Best regards,
The SkillSwap Hub Admin Team

Reference: Report ID ${data.reportId}
      `,
    };
  }
}

export default ReportEmailTemplates;
