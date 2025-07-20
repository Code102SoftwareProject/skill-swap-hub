import { NextResponse, NextRequest } from 'next/server';
import connect from '@/lib/db';
import ReportInSession from '@/lib/models/reportInSessionSchema';
import { Types } from 'mongoose';
import { validateAndExtractUserId } from '@/utils/jwtAuth';

// GET - Get reports for a specific session and user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  await connect();
  try {
    // Validate JWT token and extract user ID
    const authResult = await validateAndExtractUserId(req);
    if (authResult.error) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: 401 }
      );
    }
    const authenticatedUserId = authResult.userId!;

    const { sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Verify that the authenticated user can only view their own reports
    if (userId && authenticatedUserId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: You can only view your own reports' },
        { status: 403 }
      );
    }

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const query: any = { sessionId: new Types.ObjectId(sessionId) };
    
    // Use the authenticated user ID (either from parameter or token)
    const targetUserId = userId || authenticatedUserId;
    
    if (!Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    // Get reports where user is either reporter or reported
    query.$or = [
      { reportedBy: new Types.ObjectId(targetUserId) },
      { reportedUser: new Types.ObjectId(targetUserId) }
    ];

    const reports = await ReportInSession.find(query)
      .populate('reportedBy', 'firstName lastName email')
      .populate('reportedUser', 'firstName lastName email')
      .populate('sessionId', 'startDate status')
      .populate('adminId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      reports
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching session reports:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
