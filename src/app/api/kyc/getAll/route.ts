import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import KYC from "@/lib/models/KYCSchema";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Fetch all KYC records, sorted by newest first
    const records = await KYC.find({}).sort({ dateSubmitted: -1 });
    
    return NextResponse.json({ 
      success: true, 
      data: records 
    });
  } catch (err) {
    console.error("Error fetching KYC records:", err);
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}