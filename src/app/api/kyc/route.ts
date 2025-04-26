import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import KYC from "@/lib/models/KYCSchema";

// POST handler
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const newRecord = new KYC({
      nic: body.nic,
      recipient: body.recipient,
      dateSubmitted: new Date(),
      status: "Not Reviewed",
      nicUrl: body.nicUrl // Store the nicUrl from R2
    });

    await newRecord.save();
    return NextResponse.json({ 
      success: true, 
      message: "KYC record created successfully",
      data: newRecord 
    });
  } catch (err) {
    console.error("Error saving KYC record:", err);
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
