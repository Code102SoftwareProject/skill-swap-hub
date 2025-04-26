import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import KYC from "@/lib/models/KYCSchema";

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    if (!body.id || !body.status) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields: id or status"
      }, { status: 400 });
    }
    
    // Update the KYC record
    const updatedRecord = await KYC.findByIdAndUpdate(
      body.id,
      { 
        status: body.status,
        reviewed: new Date()
      },
      { new: true }
    );
    
    if (!updatedRecord) {
      return NextResponse.json({
        success: false,
        message: "KYC record not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "KYC record updated successfully",
      data: updatedRecord 
    });
  } catch (err) {
    console.error("Error updating KYC record:", err);
    return NextResponse.json({ 
      success: false, 
      message: "Server error", 
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}