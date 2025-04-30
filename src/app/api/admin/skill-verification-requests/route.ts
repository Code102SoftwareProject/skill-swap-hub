import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import VerificationRequestModel from '@/lib/models/VerificationRequest';

// GET all verification requests
export async function GET(request: NextRequest) {
  try {
    await connect();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const skillName = searchParams.get('skillName');
    
    // Build query
    const query: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    if (skillName) {
      query.skillName = { $regex: skillName, $options: 'i' };
    }
    
    // Fetch all verification requests with optional filters
    const verificationRequests = await VerificationRequestModel.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(100); // Limit to prevent performance issues
    
    return NextResponse.json({ data: verificationRequests }, { status: 200 });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}