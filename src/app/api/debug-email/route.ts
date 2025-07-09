import { NextResponse } from "next/server";
import EmailService from "@/lib/emailService";

/**
 * POST /api/debug-email
 * Debug email service configuration
 */
export async function POST(req: Request) {
  try {
    console.log("Environment variables check:");
    console.log("GMAIL_HOST:", process.env.GMAIL_HOST);
    console.log("GMAIL_PORT:", process.env.GMAIL_PORT);
    console.log("GMAIL_USER:", process.env.GMAIL_USER);
    console.log("GMAIL_PASS:", process.env.GMAIL_PASS ? "SET" : "NOT SET");

    const emailService = new EmailService();

    // Test connection
    const connectionTest = await emailService.verifyConnection();
    console.log("Connection test result:", connectionTest);

    if (!connectionTest) {
      return NextResponse.json(
        {
          success: false,
          message: "Email service connection failed",
          env: {
            host: process.env.GMAIL_HOST,
            port: process.env.GMAIL_PORT,
            user: process.env.GMAIL_USER,
            passSet: !!process.env.GMAIL_PASS,
          },
        },
        { status: 500 }
      );
    }

    // Test sending a simple email
    const testResult = await emailService.sendEmail({
      to: "renulucshmi@gmail.com",
      subject: "Debug Test Email - SkillSwap Hub",
      html: "<h1>Debug Test</h1><p>This is a debug test email to verify the email service is working.</p>",
      text: "Debug Test - This is a debug test email to verify the email service is working.",
    });

    return NextResponse.json({
      success: true,
      message: "Email debug test completed",
      connectionTest,
      emailSent: testResult,
      env: {
        host: process.env.GMAIL_HOST,
        port: process.env.GMAIL_PORT,
        user: process.env.GMAIL_USER,
        passSet: !!process.env.GMAIL_PASS,
      },
    });
  } catch (error: any) {
    console.error("Debug email error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Debug email test failed",
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
