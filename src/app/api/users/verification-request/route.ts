import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import VerificationRequestModel from '@/lib/models/VerificationRequest';


VerificationRequestModel.collection.name = 'userskillverificationrequests';

export async function GET(request: Request) {
  try {
    await connect();
    
    // Extract query parameters from URL
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
    if (!body.userId || !body.skillName || !body.skillId) {
      return NextResponse.json(
        { error: 'userId, skillName, and skillId are required' },
        { status: 400 }
      );
    }

    // Check if a pending verification request already exists for this skill
    const existingRequest = await VerificationRequestModel.findOne({
      userId: body.userId,
      skillId: body.skillId,
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending verification request already exists for this skill' },
        { status: 409 } // Conflict status code
      );
    }

    // Create the verification request
    const verificationRequest = await VerificationRequestModel.create({
      userId: body.userId,
      skillId: body.skillId,
      skillName: body.skillName,
      documents: body.documents || [],
      description: body.description || '',
      status: 'pending',
      createdAt: new Date()
    });
    
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
export async function DELETE(request: Request) {
  try {
    await connect();
    
    const {searchParams} = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const userId = searchParams.get('userId');

    if(!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400 }
      );
    }

    // Find the request by id first (without deleting)
    const verificationRequest = await VerificationRequestModel.findById(requestId);
    
    if (!verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    // Optional: Check if the request belongs to the user (security check)
    if (userId && verificationRequest.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own verification requests' },
        { status: 403 }
      );
    }

    // Check if the status allows deletion (approved or rejected, but not pending)
    if (verificationRequest.status === 'pending') {
      return NextResponse.json(
        { error: 'Cannot delete pending verification requests' },
        { status: 403 }
      );
    }

    // Now delete the request (only if status check passed)
    await VerificationRequestModel.findByIdAndDelete(requestId);
    
    return NextResponse.json(
      { message: 'Verification request deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting verification request:', error);
    return NextResponse.json(
      { error: 'Failed to delete verification request' },
      { status: 500 }
    );
  } 
}
