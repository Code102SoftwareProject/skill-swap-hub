import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // Database connection utility
import KYC from "@/lib/models/KYCSchema"; // KYC document schema model

/**
 * GET endpoint to retrieve all KYC records
 */
export async function GET(req: NextRequest) {
  try {
    // Connect to database before operations
    await dbConnect();
    
    // Fetch all KYC records, sorted by newest first
    const records = await KYC.find({}).sort({ dateSubmitted: -1 });
    
    // Return success response with data
    return NextResponse.json({ 
      success: true, 
      data: records 
    });
  } catch (err) {
    // Log error for debugging
    console.error("Error fetching KYC records:", err);
    
    // Return standardized error response
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}