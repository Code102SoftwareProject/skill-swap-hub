import { NextResponse } from 'next/server';
import connect from '../../../../lib/db';
import VerificationRequestModel from '../../../../lib/modals/VerificationRequest';

export async function GET(request: Request) {
  try {
    await connect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    const requests = await VerificationRequestModel.find({ userId })
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ data: requests }, { status: 200 });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connect();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.skillName) {
      return NextResponse.json(
        { error: 'userId and skillName are required' },
        { status: 400 }
      );
    }

    // Renamed variable to avoid naming conflict with the Request type
    const verificationRequest = await VerificationRequestModel.create(body);
    
    return NextResponse.json(
      { data: verificationRequest }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating verification request:', error);
    return NextResponse.json(
      { error: 'Failed to create verification request' },
      { status: 500 }
    );
  }
}