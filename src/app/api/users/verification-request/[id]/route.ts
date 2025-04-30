import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/db';
import VerificationRequestModel from '@/lib/models/VerificationRequest';
import { headers } from 'next/headers';

export async function PATCH(request: NextRequest) {
  const headersInstance = headers();
  
  try {
    // Extract verification request ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1];

    await connect();

    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const updatedRequest = await VerificationRequestModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedRequest }, { status: 200 });
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json(
      { error: 'Failed to update verification request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract verification request ID from the URL path
    const url = request.url;
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1];

    await connect();

    const verificationRequest = await VerificationRequestModel.findById(id);

    if (!verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: verificationRequest }, { status: 200 });
  } catch (error) {
    console.error('Error fetching verification request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification request' },
      { status: 500 }
    );
  }
}