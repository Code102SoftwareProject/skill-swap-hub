import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class TestEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Use Ethereal Email for testing (fake SMTP service)
    const config: EmailConfig = {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "ethereal.user@ethereal.email",
        pass: "ethereal.pass",
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(
    emailData: EmailData
  ): Promise<{ success: boolean; previewUrl?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: '"SkillSwap Hub Admin" <admin@skillswaphub.com>',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      });

      console.log("Test email sent successfully:", info.messageId);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("Preview URL:", previewUrl);

      return {
        success: true,
        previewUrl: previewUrl || undefined,
      };
    } catch (error) {
      console.error("Error sending test email:", error);
      return { success: false };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log("Test email service connection verified");
      return true;
    } catch (error) {
      console.error("Test email service connection failed:", error);
      return false;
    }
  }
}

export default TestEmailService;
