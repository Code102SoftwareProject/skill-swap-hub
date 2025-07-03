import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import { Types } from 'mongoose';

// GET - Get session by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const session = await Session.findById(id)
      .populate('user1Id', 'firstName lastName email avatar')
      .populate('user2Id', 'firstName lastName email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .populate('progress1')
      .populate('progress2');

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update session by ID
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    const { id } = await params;
    const body = await req.json();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Validate status if being updated
    if (body.status && !['active', 'completed', 'canceled'].includes(body.status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects if present
    if (body.startDate) {
      body.startDate = new Date(body.startDate);
    }

    // Convert string IDs to ObjectIds if present
    if (body.user1Id && typeof body.user1Id === 'string') {
      if (!Types.ObjectId.isValid(body.user1Id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user1Id format' },
          { status: 400 }
        );
      }
      body.user1Id = new Types.ObjectId(body.user1Id);
    }
    if (body.user2Id && typeof body.user2Id === 'string') {
      if (!Types.ObjectId.isValid(body.user2Id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user2Id format' },
          { status: 400 }
        );
      }
      body.user2Id = new Types.ObjectId(body.user2Id);
    }
    if (body.skill1Id && typeof body.skill1Id === 'string') {
      if (!Types.ObjectId.isValid(body.skill1Id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid skill1Id format' },
          { status: 400 }
        );
      }
      body.skill1Id = new Types.ObjectId(body.skill1Id);
    }
    if (body.skill2Id && typeof body.skill2Id === 'string') {
      if (!Types.ObjectId.isValid(body.skill2Id)) {
        return NextResponse.json(
          { success: false, message: 'Invalid skill2Id format' },
          { status: 400 }
        );
      }
      body.skill2Id = new Types.ObjectId(body.skill2Id);
    }

    const session = await Session.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('user1Id', 'name email avatar')
      .populate('user2Id', 'name email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .populate('progress1')
      .populate('progress2');

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete session by ID
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const session = await Session.findByIdAndDelete(id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
      session
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
