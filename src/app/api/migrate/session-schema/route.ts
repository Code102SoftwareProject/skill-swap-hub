import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import User from '@/lib/models/userSchema';

/**
 * Migration endpoint to update session schema
 * - Adds rejectedBy and rejectedAt fields to existing sessions
 * - Sets status to 'rejected' for sessions that have isAccepted=false and status='canceled'
 * 
 * Usage with curl from PowerShell:
 * curl -v "http://localhost:3000/api/migrate/session-schema" -H "Authorization: Bearer YOUR_SECRET_KEY"
 */
export async function GET(req: Request) {
  try {
    // Simple security check - require authorization header with a secret key
    const authHeader = req.headers.get('authorization');
    const secretKey = process.env.MIGRATION_SECRET_KEY || 'skill-swap-migration-key';
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== secretKey) {
      console.log('Unauthorized migration attempt');
      return NextResponse.json({
        success: false,
        message: 'Unauthorized. Include a valid Authorization header.'
      }, { status: 401 });
    }

    await connect();
    console.log('Connected to database, starting session schema migration');

    // Find all sessions with isAccepted=false but status='canceled' (old schema)
    const sessionsToUpdate = await Session.find({
      isAccepted: false,
      status: 'canceled'
    });

    console.log(`Found ${sessionsToUpdate.length} sessions to update`);
    const updatedSessions = [];

    // Update each session to have the rejected status
    for (const session of sessionsToUpdate) {
      console.log(`Updating session ${session._id}`);
      
      // Set status to 'rejected' 
      session.status = 'rejected';
      
      // If session has a createdAt date, use that for rejectedAt
      // Otherwise, use current date
      if (!session.rejectedAt) {
        session.rejectedAt = session.updatedAt || new Date();
      }
      
      // If rejectedBy is not set, set it to user2Id 
      // (assuming the receiver is the one who rejected it)
      if (!session.rejectedBy) {
        session.rejectedBy = session.user2Id;
      }
      
      await session.save();
      updatedSessions.push({
        id: session._id.toString(),
        user1: session.user1Id.toString(),
        user2: session.user2Id.toString(),
        rejectedBy: session.rejectedBy.toString()
      });
    }

    // Count sessions by status for reporting
    const statusCounts = await Session.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get a sample of updated sessions to verify (without population to avoid schema issues)
    const sampleSessions = await Session.find({ status: 'rejected' })
      .limit(5)
      .select('_id status isAccepted rejectedBy rejectedAt user1Id user2Id');

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${sessionsToUpdate.length} sessions`,
      migrated: sessionsToUpdate.length,
      updatedSessions: updatedSessions,
      statusCounts: statusCounts.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      sampleSessions: sampleSessions.map(s => ({
        id: s._id.toString(),
        status: s.status,
        isAccepted: s.isAccepted,
        user1Id: s.user1Id.toString(),
        user2Id: s.user2Id.toString(),
        rejectedBy: s.rejectedBy ? s.rejectedBy.toString() : null,
        rejectedAt: s.rejectedAt ? s.rejectedAt.toISOString() : null
      }))
    });
    
  } catch (error) {
    console.error('Error in session schema migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

// Also add a POST method to support both GET and POST
export const POST = GET;
