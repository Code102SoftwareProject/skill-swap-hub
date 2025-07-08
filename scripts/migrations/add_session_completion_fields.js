const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Get MongoDB connection string from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function migrateSessionCompletionFields() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const sessionsCollection = db.collection('sessions');

    // Check how many sessions exist
    const totalSessions = await sessionsCollection.countDocuments();
    console.log(`Found ${totalSessions} sessions to migrate`);

    if (totalSessions === 0) {
      console.log('No sessions found to migrate');
      return;
    }

    // Find sessions that don't have the completion fields
    const sessionsToMigrate = await sessionsCollection.find({
      $or: [
        { completionRequestedBy: { $exists: false } },
        { completionRequestedAt: { $exists: false } },
        { completionApprovedBy: { $exists: false } },
        { completionApprovedAt: { $exists: false } },
        { completionRejectedBy: { $exists: false } },
        { completionRejectedAt: { $exists: false } },
        { completionRejectionReason: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${sessionsToMigrate.length} sessions that need completion fields added`);

    if (sessionsToMigrate.length === 0) {
      console.log('All sessions already have completion fields');
      return;
    }

    // Add completion fields to sessions that don't have them
    const updateResult = await sessionsCollection.updateMany(
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
          // Only set fields that don't exist
          ...(sessionsToMigrate.some(s => !s.hasOwnProperty('completionRequestedBy')) && { completionRequestedBy: null }),
          ...(sessionsToMigrate.some(s => !s.hasOwnProperty('completionRequestedAt')) && { completionRequestedAt: null }),
          ...(sessionsToMigrate.some(s => !s.hasOwnProperty('completionApprovedBy')) && { completionApprovedBy: null }),
          ...(sessionsToMigrate.some(s => !s.hasOwnProperty('completionApprovedAt')) && { completionApprovedAt: null }),
          ...(sessionsToMigrate.some(s => !s.hasOwnProperty('completionRejectedBy')) && { completionRejectedBy: null }),
          ...(sessionsToMigrate.some(s => !s.hasOwnProperty('completionRejectedAt')) && { completionRejectedAt: null }),
          ...(sessionsToMigrate.some(s => !s.hasOwnProperty('completionRejectionReason')) && { completionRejectionReason: null })
        }
      }
    );

    console.log(`Migration completed successfully!`);
    console.log(`Modified ${updateResult.modifiedCount} sessions`);
    console.log(`Matched ${updateResult.matchedCount} sessions`);

    // Verify the migration
    const verificationCount = await sessionsCollection.countDocuments({
      completionRequestedBy: { $exists: true },
      completionRequestedAt: { $exists: true },
      completionApprovedBy: { $exists: true },
      completionApprovedAt: { $exists: true },
      completionRejectedBy: { $exists: true },
      completionRejectedAt: { $exists: true },
      completionRejectionReason: { $exists: true }
    });

    console.log(`Verification: ${verificationCount} sessions now have all completion fields`);

    // Show sample of migrated session
    const sampleSession = await sessionsCollection.findOne({}, { 
      projection: { 
        _id: 1, 
        status: 1,
        completionRequestedBy: 1,
        completionRequestedAt: 1,
        completionApprovedBy: 1,
        completionApprovedAt: 1,
        completionRejectedBy: 1,
        completionRejectedAt: 1,
        completionRejectionReason: 1
      } 
    });
    
    console.log('\nSample migrated session:');
    console.log(JSON.stringify(sampleSession, null, 2));

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Better migration that handles each field individually
async function migrateSessionCompletionFieldsIndividual() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const sessionsCollection = db.collection('sessions');

    const completionFields = [
      'completionRequestedBy',
      'completionRequestedAt', 
      'completionApprovedBy',
      'completionApprovedAt',
      'completionRejectedBy',
      'completionRejectedAt',
      'completionRejectionReason'
    ];

    console.log('Starting individual field migration...');

    for (const field of completionFields) {
      // Count sessions missing this field
      const missingCount = await sessionsCollection.countDocuments({
        [field]: { $exists: false }
      });

      if (missingCount > 0) {
        console.log(`Adding ${field} to ${missingCount} sessions...`);
        
        const result = await sessionsCollection.updateMany(
          { [field]: { $exists: false } },
          { $set: { [field]: null } }
        );

        console.log(`  ✓ Updated ${result.modifiedCount} sessions with ${field}`);
      } else {
        console.log(`  ✓ All sessions already have ${field}`);
      }
    }

    console.log('\nMigration completed successfully!');

    // Final verification
    const totalSessions = await sessionsCollection.countDocuments();
    const fullyMigratedCount = await sessionsCollection.countDocuments({
      completionRequestedBy: { $exists: true },
      completionRequestedAt: { $exists: true },
      completionApprovedBy: { $exists: true },
      completionApprovedAt: { $exists: true },
      completionRejectedBy: { $exists: true },
      completionRejectedAt: { $exists: true },
      completionRejectionReason: { $exists: true }
    });

    console.log(`\nVerification Results:`);
    console.log(`Total sessions: ${totalSessions}`);
    console.log(`Sessions with all completion fields: ${fullyMigratedCount}`);
    console.log(`Migration success rate: ${((fullyMigratedCount / totalSessions) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the migration
console.log('Starting Session Completion Fields Migration...');
console.log('=====================================');

migrateSessionCompletionFieldsIndividual()
  .then(() => {
    console.log('Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });
