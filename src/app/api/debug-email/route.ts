import { NextResponse } from "next/server";

/**
 * POST /api/debug-email
 * Debug email service configuration - DEPRECATED
 * This endpoint is kept for backward compatibility but no longer uses nodemailer
 */
export async function POST(req: Request) {
  try {
    // This endpoint has been deprecated since we now use mailto links
    // instead of sending emails directly from the server

    return NextResponse.json(
      {
        success: true,
        message:
          "Email service has been replaced with mailto links in frontend",
        info: "This debug endpoint is deprecated",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in debug-email endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error in debug-email endpoint",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
