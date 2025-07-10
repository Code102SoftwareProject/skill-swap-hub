import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';
import SessionCompletion from '@/lib/models/sessionCompletionSchema';

// POST - Migrate existing completion data from sessions to SessionCompletion schema
export async function POST(req: Request) {
  await connect();
  
  try {
    console.log('Starting session completion data migration...');
    
    // Find sessions that have completion data but no corresponding SessionCompletion records
    const sessionsWithCompletion = await Session.find({
      $or: [
        { completionRequestedBy: { $exists: true, $ne: null } },
        { completionApprovedBy: { $exists: true, $ne: null } },
        { completionRejectedBy: { $exists: true, $ne: null } }
      ]
    });

    console.log(`Found ${sessionsWithCompletion.length} sessions with completion data`);

    if (sessionsWithCompletion.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions with completion data found',
        migrated: 0
      }, { status: 200 });
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const session of sessionsWithCompletion) {
      try {
        // Check if SessionCompletion records already exist for this session
        const existingCompletions = await SessionCompletion.find({ sessionId: session._id });
        
        if (existingCompletions.length > 0) {
          console.log(`Skipping session ${session._id} - already has SessionCompletion records`);
          skippedCount++;
          continue;
        }

        // Create SessionCompletion record based on session data
        if (session.completionRequestedBy) {
          const completionData: any = {
            sessionId: session._id,
            requestedBy: session.completionRequestedBy,
            requestedAt: session.completionRequestedAt || new Date(),
            requestForUser: 'both'
          };

          // Determine status based on session data
          if (session.completionApprovedBy) {
            completionData.status = 'approved';
            completionData.approvedBy = session.completionApprovedBy;
            completionData.approvedAt = session.completionApprovedAt || new Date();
          } else if (session.completionRejectedBy) {
            completionData.status = 'rejected';
            completionData.rejectedBy = session.completionRejectedBy;
            completionData.rejectedAt = session.completionRejectedAt || new Date();
            completionData.rejectionReason = session.completionRejectionReason || 'Migrated rejection';
          } else {
            completionData.status = 'pending';
          }

          await SessionCompletion.create(completionData);
          migratedCount++;
          console.log(`Migrated completion data for session ${session._id}`);
        }

        // Handle cases where there's only approval/rejection without request
        else if (session.completionApprovedBy || session.completionRejectedBy) {
          // Create a completion record with unknown requester
          const completionData: any = {
            sessionId: session._id,
            requestedBy: session.completionApprovedBy || session.completionRejectedBy,
            requestedAt: session.completionApprovedAt || session.completionRejectedAt || new Date(),
            requestForUser: 'both'
          };

          if (session.completionApprovedBy) {
            completionData.status = 'approved';
            completionData.approvedBy = session.completionApprovedBy;
            completionData.approvedAt = session.completionApprovedAt || new Date();
          } else {
            completionData.status = 'rejected';
            completionData.rejectedBy = session.completionRejectedBy;
            completionData.rejectedAt = session.completionRejectedAt || new Date();
            completionData.rejectionReason = session.completionRejectionReason || 'Migrated rejection';
          }

          await SessionCompletion.create(completionData);
          migratedCount++;
          console.log(`Migrated orphaned completion data for session ${session._id}`);
        }

      } catch (sessionError: any) {
        console.error(`Error migrating session ${session._id}:`, sessionError);
        // Continue with next session
      }
    }

    // Verification
    const totalSessionCompletions = await SessionCompletion.countDocuments();

    console.log(`Migration completed!`);
    console.log(`Migrated: ${migratedCount} sessions`);
    console.log(`Skipped: ${skippedCount} sessions`);
    console.log(`Total SessionCompletion records: ${totalSessionCompletions}`);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        sessionsWithCompletion: sessionsWithCompletion.length,
        migrated: migratedCount,
        skipped: skippedCount,
        totalSessionCompletions
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error.message
    }, { status: 500 });
  }
}

// GET - Check migration status
export async function GET() {
  await connect();
  
  try {
    const sessionsWithCompletion = await Session.countDocuments({
      $or: [
        { completionRequestedBy: { $exists: true, $ne: null } },
        { completionApprovedBy: { $exists: true, $ne: null } },
        { completionRejectedBy: { $exists: true, $ne: null } }
      ]
    });

    const sessionCompletionRecords = await SessionCompletion.countDocuments();

    const migrationNeeded = sessionsWithCompletion > 0;

    return NextResponse.json({
      success: true,
      migrationStatus: {
        sessionsWithCompletion,
        sessionCompletionRecords,
        migrationNeeded,
        message: migrationNeeded 
          ? 'Migration needed - some sessions have completion data but no SessionCompletion records'
          : 'Migration not needed - all completion data is properly structured'
      }
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message
    }, { status: 500 });
  }
}
