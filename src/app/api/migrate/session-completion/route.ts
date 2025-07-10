import { NextResponse } from 'next/server';
import connect from '@/lib/db';
import Session from '@/lib/models/sessionSchema';

// POST - Run session completion fields migration
export async function POST(req: Request) {
  await connect();
  
  try {
    console.log('Starting session completion fields migration...');
    
    // Check if migration has already been run
    const existingSessionWithFields = await Session.findOne({
      completionRequestedBy: { $exists: true },
      completionRequestedAt: { $exists: true },
      completionApprovedBy: { $exists: true },
      completionApprovedAt: { $exists: true },
      completionRejectedBy: { $exists: true },
      completionRejectedAt: { $exists: true },
      completionRejectionReason: { $exists: true }
    });

    if (existingSessionWithFields) {
      const totalSessions = await Session.countDocuments();
      const migratedSessions = await Session.countDocuments({
        completionRequestedBy: { $exists: true },
        completionRequestedAt: { $exists: true },
        completionApprovedBy: { $exists: true },
        completionApprovedAt: { $exists: true },
        completionRejectedBy: { $exists: true },
        completionRejectedAt: { $exists: true },
        completionRejectionReason: { $exists: true }
      });

      return NextResponse.json({
        success: true,
        message: 'Migration already completed',
        stats: {
          totalSessions,
          migratedSessions,
          migrationComplete: migratedSessions === totalSessions
        }
      }, { status: 200 });
    }

    // Get all sessions that need migration
    const sessionsToMigrate = await Session.find({
      $or: [
        { completionRequestedBy: { $exists: false } },
        { completionRequestedAt: { $exists: false } },
        { completionApprovedBy: { $exists: false } },
        { completionApprovedAt: { $exists: false } },
        { completionRejectedBy: { $exists: false } },
        { completionRejectedAt: { $exists: false } },
        { completionRejectionReason: { $exists: false } }
      ]
    }).select('_id');

    if (sessionsToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions need migration',
        stats: {
          totalSessions: await Session.countDocuments(),
          sessionsToMigrate: 0
        }
      }, { status: 200 });
    }

    console.log(`Found ${sessionsToMigrate.length} sessions to migrate`);

    // Add completion fields to sessions that need them
    const updateResult = await Session.updateMany(
      {
        $or: [
          { completionRequestedBy: { $exists: false } },
          { completionRequestedAt: { $exists: false } },
          { completionApprovedBy: { $exists: false } },
          { completionApprovedAt: { $exists: false } },
          { completionRejectedBy: { $exists: false } },
          { completionRejectedAt: { $exists: false } },
          { completionRejectionReason: { $exists: false } }
        ]
      },
      {
        $set: {
          completionRequestedBy: null,
          completionRequestedAt: null,
          completionApprovedBy: null,
          completionApprovedAt: null,
          completionRejectedBy: null,
          completionRejectedAt: null,
          completionRejectionReason: null
        }
      }
    );

    // Verification
    const totalSessions = await Session.countDocuments();
    const migratedSessions = await Session.countDocuments({
      completionRequestedBy: { $exists: true },
      completionRequestedAt: { $exists: true },
      completionApprovedBy: { $exists: true },
      completionApprovedAt: { $exists: true },
      completionRejectedBy: { $exists: true },
      completionRejectedAt: { $exists: true },
      completionRejectionReason: { $exists: true }
    });

    console.log(`Migration completed: ${updateResult.modifiedCount} sessions updated`);
    console.log(`Verification: ${migratedSessions}/${totalSessions} sessions have completion fields`);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        totalSessions,
        sessionsToMigrate: sessionsToMigrate.length,
        sessionsModified: updateResult.modifiedCount,
        migratedSessions,
        migrationComplete: migratedSessions === totalSessions
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
    const totalSessions = await Session.countDocuments();
    const migratedSessions = await Session.countDocuments({
      completionRequestedBy: { $exists: true },
      completionRequestedAt: { $exists: true },
      completionApprovedBy: { $exists: true },
      completionApprovedAt: { $exists: true },
      completionRejectedBy: { $exists: true },
      completionRejectedAt: { $exists: true },
      completionRejectionReason: { $exists: true }
    });

    const migrationComplete = migratedSessions === totalSessions;

    return NextResponse.json({
      success: true,
      migrationStatus: {
        totalSessions,
        migratedSessions,
        migrationComplete,
        migrationPercentage: totalSessions > 0 ? Math.round((migratedSessions / totalSessions) * 100) : 0
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
