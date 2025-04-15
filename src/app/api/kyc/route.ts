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
      dateSubmitted: new Date().toISOString().split("T")[0],
      status: "Unread",
      reviewed: "-",
    });

    await newRecord.save();
    return NextResponse.json({ success: true, data: newRecord });
  } catch (err) {
    console.error("Error saving KYC record:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
