import { NextRequest, NextResponse } from "next/server";
import Connect from "@/lib/db"; // Database connection utility
import KYC from "@/lib/models/KYCSchema"; // KYC document schema model

/**
 * PUT endpoint to update KYC record status
 */
export async function PUT(req: NextRequest) {
  try {
    // Connect to database before operations
    await Connect();

    // Parse request body to get update parameters
    const body = await req.json();

    // Validate required fields
    if (!body.id || !body.status) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: id or status",
        },
        { status: 400 }
      );
    }

    // Pull rejectionReason if provided
    const { id, status, rejectionReason } = body;

    // Update the KYC record with new status, review timestamp, and optional reason
    const updatedRecord = await KYC.findByIdAndUpdate(
      id,
      {
        status,
        reviewed: new Date(),
        // only include the field when rejecting
        ...(rejectionReason ? { rejectionReason } : {}),
      },
      { new: true } // Return updated document instead of original
    );

    // Handle case where record isn't found
    if (!updatedRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "KYC record not found",
        },
        { status: 404 }
      );
    }

    // Return success response with updated record
    return NextResponse.json({
      success: true,
      message: "KYC record updated successfully",
      data: updatedRecord,
    });
  } catch (err) {
    // Log error for debugging
    console.error("Error updating KYC record:", err);

    // Return standardized error response
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
