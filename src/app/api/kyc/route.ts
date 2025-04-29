import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // Database connection utility
import KYC from "@/lib/models/KYCSchema"; // KYC document schema model

/**
 * POST endpoint to create new KYC record
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to database before operations
    await dbConnect();
    
    // Parse request body to get KYC details
    const body = await req.json();

    // Create new KYC record object with provided data
    const newRecord = new KYC({
      nic: body.nic,
      recipient: body.recipient,
      dateSubmitted: new Date(),
      status: "Not Reviewed",
      nicUrl: body.nicUrl, // Store the nicUrl from R2
      nicWithPersonUrl: body.nicWithPersonUrl // Store the photo URL with person holding NIC
    });

    // Save record to database
    await newRecord.save();
    
    // Return success response with created record
    return NextResponse.json({ 
      success: true, 
      message: "KYC record created successfully",
      data: newRecord 
    });
  } catch (err) {
    // Log error for debugging
    console.error("Error saving KYC record:", err);
    
    // Return standardized error response
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
