import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Work from '@/lib/models/workSchema';
import { Types } from 'mongoose';

// GET - Get a specific work by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  try {
    const { id } = params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid work ID format' },
        { status: 400 }
      );
    }

    const work = await Work.findById(id)
      .populate('session')
      .populate('provideUser', 'name email avatar')
      .populate('receiveUser', 'name email avatar');

    if (!work) {
      return NextResponse.json(
        { success: false, message: 'Work not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      work
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Accept or reject work
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  try {
    const { id } = params;
    const body = await req.json();
    const { action, userId, rejectionReason, rating, remark } = body;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid work ID format' },
        { status: 400 }
      );
    }

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    const work = await Work.findById(id);
    if (!work) {
      return NextResponse.json(
        { success: false, message: 'Work not found' },
        { status: 404 }
      );
    }

    // Verify that the user responding is the receiver of the work
    if (work.receiveUser.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: 'Only the work receiver can accept or reject this work' },
        { status: 403 }
      );
    }

    // Check if work is still pending
    if (work.acceptanceStatus !== 'pending') {
      return NextResponse.json(
        { success: false, message: `Work is already ${work.acceptanceStatus}` },
        { status: 400 }
      );
    }

    const updateData: any = {
      acceptanceStatus: action === 'accept' ? 'accepted' : 'rejected'
    };

    if (action === 'reject' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    if (action === 'accept') {
      if (rating !== undefined && rating >= 1 && rating <= 5) {
        updateData.rating = rating;
      }
      if (remark) {
        updateData.remark = remark;
      }
    }

    const updatedWork = await Work.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('session')
      .populate('provideUser', 'name email avatar')
      .populate('receiveUser', 'name email avatar');

    return NextResponse.json({
      success: true,
      work: updatedWork,
      message: `Work ${action}ed successfully`
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete work (only by the provider)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid work ID format' },
        { status: 400 }
      );
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'Valid user ID is required' },
        { status: 400 }
      );
    }

    const work = await Work.findById(id);
    if (!work) {
      return NextResponse.json(
        { success: false, message: 'Work not found' },
        { status: 404 }
      );
    }

    // Verify that the user deleting is the provider of the work
    if (work.provideUser.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: 'Only the work provider can delete this work' },
        { status: 403 }
      );
    }

    // Only allow deletion if work is still pending
    if (work.acceptanceStatus !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete work that has already been responded to' },
        { status: 400 }
      );
    }

    await Work.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Work deleted successfully'
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
