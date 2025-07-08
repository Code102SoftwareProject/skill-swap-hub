import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import { Types } from 'mongoose';

// GET - Get basic session data without population (temporary fix)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  await connect();
  try {
    const { sessionId } = await params;

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Get basic session data without problematic population
    const session = await Session.findById(sessionId)
      .populate('user1Id', 'firstName lastName email avatar')
      .populate('user2Id', 'firstName lastName email avatar')
      .populate('skill1Id', 'skillTitle proficiencyLevel categoryName')
      .populate('skill2Id', 'skillTitle proficiencyLevel categoryName')
      .lean(); // Use lean for better performance

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
    console.error('Error in GET /api/session/basic/[sessionId]:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
