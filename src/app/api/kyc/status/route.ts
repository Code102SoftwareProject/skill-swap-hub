import { NextRequest, NextResponse } from "next/server";
import Connect from "@/lib/db";
import KYC from "@/lib/models/KYCSchema"; // Assuming userId is stored as 'recipient'

/**
 * GET KYC status for a specific user by their userId (recipient)
 * @example /api/kyc/status?userId=abc123
 */
export async function GET(req: NextRequest) {
  try {
    await Connect();

    // Get userId (recipient) from query param
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing userId in query parameters",
        },
        { status: 400 }
      );
    }

    // Find KYC record for the given user
    const record = await KYC.findOne({ recipient: userId });

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          message: "KYC record not found for this user",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: record.status,
      message: `KYC status for user ${userId} is '${record.status}'`,
    });
  } catch (error) {
    console.error("KYC status fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error while fetching KYC status",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
