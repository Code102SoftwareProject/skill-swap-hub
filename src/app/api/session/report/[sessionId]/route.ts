import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ReportInSession from '@/lib/models/reportInSessionSchema';
import { Types } from 'mongoose';

// GET - Get reports for a specific session and user
export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  await connect();
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const query: any = { sessionId: new Types.ObjectId(sessionId) };
    
    // If userId is provided, get reports where user is either reporter or reported
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid user ID format' },
          { status: 400 }
        );
      }
      
      query.$or = [
        { reportedBy: new Types.ObjectId(userId) },
        { reportedUser: new Types.ObjectId(userId) }
      ];
    }

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
