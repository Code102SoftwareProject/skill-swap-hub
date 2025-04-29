import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/db";
import KYC from "@/lib/models/KYCSchema";

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connect();
    
    // Find all KYC documents that don't have nicWithPersonUrl field
    const result = await KYC.updateMany(
      { nicWithPersonUrl: { $exists: false } }, 
      { $set: { nicWithPersonUrl: null } }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: `Migration completed successfully`,
      modified: result.modifiedCount,
      matched: result.matchedCount
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}