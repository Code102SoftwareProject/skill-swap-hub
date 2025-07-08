// Migration script to add completion fields to existing sessions
// Run this with: node scripts/migrations/add_session_completion_fields_mongoose.js

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Import your models (adjust paths as needed)
const Session = require('../../src/lib/models/sessionSchema').default;

async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function migrateSessionCompletionFields() {
  try {
    console.log('Starting migration for session completion fields...');
    
    // Get all sessions
    const allSessions = await Session.find({}).select('_id status completionRequestedBy completionRequestedAt completionApprovedBy completionApprovedAt completionRejectedBy completionRejectedAt completionRejectionReason');
    console.log(`Found ${allSessions.length} total sessions`);
    
    // Find sessions missing completion fields
    const sessionsToUpdate = [];
    
    for (const session of allSessions) {
      const needsUpdate = !session.completionRequestedBy && 
                         !session.completionRequestedAt && 
                         !session.completionApprovedBy && 
                         !session.completionApprovedAt && 
                         !session.completionRejectedBy && 
                         !session.completionRejectedAt && 
                         !session.completionRejectionReason;
      
      if (needsUpdate) {
        sessionsToUpdate.push(session._id);
      }
    }
    
    console.log(`Found ${sessionsToUpdate.length} sessions that need completion fields`);
    
    if (sessionsToUpdate.length === 0) {
      console.log('✓ All sessions already have completion fields');
      return;
    }
    
    // Update sessions in batches
    const batchSize = 100;
    let updatedCount = 0;
    
    for (let i = 0; i < sessionsToUpdate.length; i += batchSize) {
      const batch = sessionsToUpdate.slice(i, i + batchSize);
      
      const result = await Session.updateMany(
        { _id: { $in: batch } },
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
      
      updatedCount += result.modifiedCount;
      console.log(`Updated batch ${Math.floor(i/batchSize) + 1}: ${result.modifiedCount} sessions`);
    }
    
    console.log(`\n✓ Migration completed successfully!`);
    console.log(`Total sessions updated: ${updatedCount}`);
    
    // Verification
    const verificationSessions = await Session.find({
      completionRequestedBy: { $exists: true },
      completionRequestedAt: { $exists: true },
      completionApprovedBy: { $exists: true },
      completionApprovedAt: { $exists: true },
      completionRejectedBy: { $exists: true },
      completionRejectedAt: { $exists: true },
      completionRejectionReason: { $exists: true }
    }).countDocuments();
    
    console.log(`\nVerification: ${verificationSessions} sessions now have all completion fields`);
    console.log(`Migration success rate: ${((verificationSessions / allSessions.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function runMigration() {
  try {
    await connectToDatabase();
    await migrateSessionCompletionFields();
    
    console.log('\n🎉 Migration process completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
console.log('Session Completion Fields Migration');
console.log('===================================');
runMigration();
