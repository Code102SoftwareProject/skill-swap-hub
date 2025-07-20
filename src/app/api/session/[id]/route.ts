import { NextResponse, NextRequest } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import User from '@/lib/models/userSchema';
import UserSkill from '@/lib/models/userSkill';
import SessionProgress from '@/lib/models/sessionProgressSchema';
import { validateAndExtractUserId } from '@/utils/jwtAuth';
import { Types } from 'mongoose';

// GET - Get session by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        message: authResult.error
      }, { status: 401 });
    }
    
    const authenticatedUserId = authResult.userId!;
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
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName');

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate that the authenticated user is involved in this session
    const user1IdString = session.user1Id._id ? session.user1Id._id.toString() : session.user1Id.toString();
    const user2IdString = session.user2Id._id ? session.user2Id._id.toString() : session.user2Id.toString();
    
    if (user1IdString !== authenticatedUserId && user2IdString !== authenticatedUserId) {
      return NextResponse.json({
        success: false,
        message: "Forbidden: You can only access sessions you are involved in"
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      session
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/session/[id]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update session by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        message: authResult.error
      }, { status: 401 });
    }
    
    const authenticatedUserId = authResult.userId!;
    const { id } = await params;
    const body = await req.json();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Find the session first to validate access
    const existingSession = await Session.findById(id);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate that the authenticated user is involved in this session
    if (existingSession.user1Id.toString() !== authenticatedUserId && existingSession.user2Id.toString() !== authenticatedUserId) {
      return NextResponse.json({
        success: false,
        message: "Forbidden: You can only update sessions you are involved in"
      }, { status: 403 });
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

// DELETE - Delete session by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        message: authResult.error
      }, { status: 401 });
    }
    
    const authenticatedUserId = authResult.userId!;
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Find the session first to validate access
    const existingSession = await Session.findById(id);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Validate that the authenticated user is involved in this session
    if (existingSession.user1Id.toString() !== authenticatedUserId && existingSession.user2Id.toString() !== authenticatedUserId) {
      return NextResponse.json({
        success: false,
        message: "Forbidden: You can only delete sessions you are involved in"
      }, { status: 403 });
    }

    const session = await Session.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
      session: existingSession
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
