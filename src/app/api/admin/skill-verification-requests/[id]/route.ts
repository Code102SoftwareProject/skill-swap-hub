import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connect from '@/lib/db';
import VerificationRequestModel from '@/lib/models/VerificationRequest';
import UserSkill from '@/lib/models/userSkill';

export async function PATCH(request: NextRequest) {
  try {
    await connect();
    
    // Get ID from the URL pathname
    const segments = request.nextUrl.pathname.split('/');
    const requestId = segments[segments.length - 1];
    
    // Make sure we have a valid ID
    if (!requestId) {
      return NextResponse.json(
        { success: false, message: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json(
        { success: false, message: `Invalid request ID format: ${requestId}` },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    console.log('Request body:', body); // Add logging to verify what's being received
    const { status, skillId, feedback } = body;
    
    // Validate input
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }
    
    // Require feedback for rejection
    if (status === 'rejected' && !feedback) {
      return NextResponse.json(
        { success: false, message: 'Feedback is required when rejecting a verification request' },
        { status: 400 }
      );
    }
    
    // Find the verification request by _id
    const verificationRequest = await VerificationRequestModel.findById(requestId);
    
    if (!verificationRequest) {
      return NextResponse.json(
        { success: false, message: `Verification request with ID ${requestId} not found` },
        { status: 404 }
      );
    }
    
    console.log('Before update - Request status:', verificationRequest.status);
    
    // Update verification request status and feedback if provided
    verificationRequest.status = status;
    if (feedback) {
      verificationRequest.feedback = feedback;
    }
    
    const updatedRequest = await verificationRequest.save();
    
    console.log('After update - Request status:', updatedRequest.status);
    
    // If request is approved, update the user's skill verification status
    const skillIdToUpdate = skillId || verificationRequest.skillId;
    console.log('Skill ID to update:', skillIdToUpdate);
    
    if (status === 'approved' && skillIdToUpdate) {
      try {
        // Make sure we're using findById with the correct ID format
        if (!mongoose.Types.ObjectId.isValid(skillIdToUpdate)) {
          console.warn(`Invalid skillId format: ${skillIdToUpdate}`);
        } else {
          const userSkill = await UserSkill.findById(skillIdToUpdate);
          
          if (userSkill) {
            console.log('Before update - Skill verification status:', userSkill.isVerified);
            userSkill.isVerified = true;
            const updatedSkill = await userSkill.save();
            console.log('After update - Skill verification status:', updatedSkill.isVerified);
          } else {
            console.warn(`UserSkill with ID ${skillIdToUpdate} not found`);
          }
        }
      } catch (skillError) {
        console.error(`Error updating UserSkill with ID ${skillIdToUpdate}:`, skillError);
        // Don't fail the whole request if just the skill update fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Verification request ${status}`,
      data: updatedRequest 
    });
  } catch (error) {
    console.error('Error updating verification request:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update verification request',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}