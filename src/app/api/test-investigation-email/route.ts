import { NextResponse } from "next/server";

/**
 * POST /api/test-investigation-email
 * Test investigation email workflow (simplified for testing)
 */
export async function POST(req: Request) {
  try {
    const { reportId } = await req.json();

    // Simulate the investigation email workflow
    const emailResults = [
      {
        email: "renulucshmi@gmail.com",
        type: "reported_user",
        status: "sent",
        subject: "Report Investigation: Your Response Required - SkillSwap Hub",
        message: "Email sent successfully (simulated)",
      },
      {
        email: "renulucshmip@gmail.com",
        type: "reporting_user",
        status: "sent",
        subject:
          "Report Investigation Update: Additional Information Request - SkillSwap Hub",
        message: "Email sent successfully (simulated)",
      },
    ];

    return NextResponse.json({
      success: true,
      message: "Investigation emails sent successfully",
      emailsSent: emailResults,
      report: {
        id: reportId || "686e3657784c017a309fb42d",
        status: "under_review",
        investigationStartedAt: new Date().toISOString(),
        emailsSentAt: new Date().toISOString(),
      },
      emailTemplates: {
        reportedUser: {
          subject:
            "Report Investigation: Your Response Required - SkillSwap Hub",
          preview:
            "A formal investigation has been initiated regarding your recent session. Please respond within 3 days.",
        },
        reportingUser: {
          subject:
            "Report Investigation Update: Additional Information Request - SkillSwap Hub",
          preview:
            "Thank you for your report. We need additional information to complete our investigation.",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Test investigation email failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
