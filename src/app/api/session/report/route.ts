import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import ReportInSession from '@/lib/models/reportInSessionSchema';
import OnlineLogSchema from '@/lib/models/onlineLogSchema';
import Work from '@/lib/models/workSchema';
import { Types } from 'mongoose';

// POST - Submit a report for a user in a session
export async function POST(req: Request) {
  await connect();
  try {
    const body = await req.json();
    const { 
      sessionId, 
      reportedBy, 
      reportedUser, 
      reason, 
      description, 
      evidenceFiles 
    } = body;

    // Validate required fields
    if (!sessionId || !reportedBy || !reportedUser || !reason || !description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!Types.ObjectId.isValid(sessionId) || 
        !Types.ObjectId.isValid(reportedBy) || 
        !Types.ObjectId.isValid(reportedUser)) {
      return NextResponse.json(
        { success: false, message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Check if user is trying to report themselves
    if (reportedBy === reportedUser) {
      return NextResponse.json(
        { success: false, message: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    // Get reported user's last active date
    const reportedUserOnlineLog = await OnlineLogSchema.findOne({ 
      userId: new Types.ObjectId(reportedUser) 
    });

    // Get works data for both users in this session
    const works = await Work.find({ session: new Types.ObjectId(sessionId) });
    
    const reportedUserWorks = works.filter(w => 
      w.provideUser.toString() === reportedUser.toString()
    );
    const reportingUserWorks = works.filter(w => 
      w.provideUser.toString() === reportedBy.toString()
    );

    // Prepare works details for admin review
    const reportedUserWorksDetails = reportedUserWorks.map(work => ({
      workId: work._id,
      submissionDate: work.provideDate,
      status: work.acceptanceStatus
    }));

    const reportingUserWorksDetails = reportingUserWorks.map(work => ({
      workId: work._id,
      submissionDate: work.provideDate,
      status: work.acceptanceStatus
    }));

    // Create the report
    const report = new ReportInSession({
      sessionId: new Types.ObjectId(sessionId),
      reportedBy: new Types.ObjectId(reportedBy),
      reportedUser: new Types.ObjectId(reportedUser),
      reason,
      description,
      evidenceFiles: evidenceFiles || [],
      reportedUserLastActive: reportedUserOnlineLog?.lastOnline || null,
      reportedUserWorksCount: reportedUserWorks.length,
      reportingUserWorksCount: reportingUserWorks.length,
      reportedUserWorksDetails,
      reportingUserWorksDetails,
      status: 'pending'
    });

    await report.save();

    // Populate the report for response
    const populatedReport = await ReportInSession.findById(report._id)
      .populate('reportedBy', 'firstName lastName email')
      .populate('reportedUser', 'firstName lastName email')
      .populate('sessionId', 'startDate status');

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      report: populatedReport
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// GET - Get reports for a session (for admin use)
export async function GET(req: Request) {
  await connect();
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(sessionId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const query: any = { sessionId: new Types.ObjectId(sessionId) };
    if (status) {
      query.status = status;
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
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
