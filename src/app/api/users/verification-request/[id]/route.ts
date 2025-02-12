import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import VerificationRequestModel from '@/lib/modals/VerificationRequest';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      params.id,
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