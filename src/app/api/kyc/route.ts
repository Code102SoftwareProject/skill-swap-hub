import { NextRequest, NextResponse } from "next/server";
import Connect from "@/lib/db"; // Database connection utility
import KYC from "@/lib/models/KYCSchema"; // KYC document schema model

// KYC status constants
const KYC_STATUS = {
  NOT_REVIEWED: "Not Reviewed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// Response message constants
const MESSAGES = {
  SUCCESS: "KYC record created successfully",
  SERVER_ERROR: "Server error",
  VALIDATION_ERROR: "Missing required fields",
};

/**
 * Interface for KYC request body structure
 */
interface KYCRequest {
  userId: string;
  nic: string;
  recipient: string;
  nicUrl: string;
  nicWithPersonUrl: string;
}

/**
 * Validates that all required fields are present in the data object
 * @param data Object containing field values
 * @param requiredFields Array of field names that must be present
 * @returns Object with validation result and missing fields if any
 */
function validateRequiredFields<T>(data: T, requiredFields: Array<keyof T>) {
  const missingFields = requiredFields.filter((field) => !data[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * POST endpoint to create new KYC record
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to database before operations
    await Connect();

    // Parse request body into data object with type annotation
    const data = (await req.json()) as KYCRequest;

    // Validate required fields
    const requiredFields: Array<keyof KYCRequest> = [
      "userId",
      "nic",
      "recipient",
      "nicUrl",
      "nicWithPersonUrl",
    ];
    const validation = validateRequiredFields(data, requiredFields);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: MESSAGES.VALIDATION_ERROR,
          error: `Missing required fields: ${validation.missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create new KYC record object using the data object
    const newRecord = new KYC({
      userId: data.userId,
      nic: data.nic,
      recipient: data.recipient,
      dateSubmitted: new Date(),
      status: KYC_STATUS.NOT_REVIEWED,
      nicUrl: data.nicUrl,
      nicWithPersonUrl: data.nicWithPersonUrl,
    });

    // Save record to database
    await newRecord.save();

    // Return success response with created record
    return NextResponse.json({
      success: true,
      message: MESSAGES.SUCCESS,
      data: newRecord,
    });
  } catch (err) {
    // Log error for debugging
    console.error("Error saving KYC record:", err);

    // Return standardized error response
    return NextResponse.json(
      {
        success: false,
        message: MESSAGES.SERVER_ERROR,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
