// /src/app/api/kyc/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Connect from "@/lib/db";
import KYC from "@/lib/models/KYCSchema";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
  }

  try {
    await Connect();

    const latestKyc = await KYC
  .findOne({ userId })
  .sort({ dateSubmitted: -1 }) // 💥 FIXED
  .lean() as {
    status?: string;
    rejectionReason?: string;
  } | null;


    if (!latestKyc) {
      return NextResponse.json({ success: true, status: null });
    }

    return NextResponse.json({
      success: true,
      status: latestKyc.status,
      reason: latestKyc.status === 'Rejected' ? latestKyc.rejectionReason || null : null,
    });

  } catch (err) {
    console.error('[KYC STATUS ERROR]', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
