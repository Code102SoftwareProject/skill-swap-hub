// Migration script to add suspension field to existing users
// Run with: node -r dotenv/config src/scripts/migrations/migrate-user-suspension.js

import mongoose from 'mongoose';
import User from '../../lib/models/userSchema.js';gration script to add suspension field to existing users
// Run with: node -r dotenv/config src/scripts/migrations/migrate-user-suspension.js

const mongoose = require("mongoose");
const User = require("../../lib/models/userSchema").default;

async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/skillswaphub"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function migrateUserSuspension() {
  console.log("🔄 Starting User Schema Migration - Adding Suspension Field\n");

  try {
    // Count total users
    const totalUsers = await User.countDocuments({});
    console.log(`📊 Total users in database: ${totalUsers}`);

    // Find users without suspension field
    const usersWithoutSuspension = await User.find({
      suspension: { $exists: false },
    });

    console.log(
      `🔍 Users without suspension field: ${usersWithoutSuspension.length}`
    );

    if (usersWithoutSuspension.length === 0) {
      console.log(
        "✅ All users already have suspension field - no migration needed"
      );
      return;
    }

    // Update users in batches
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < usersWithoutSuspension.length; i += batchSize) {
      const batch = usersWithoutSuspension.slice(i, i + batchSize);
      const userIds = batch.map((user) => user._id);

      // Update batch of users
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        {
          $set: {
            "suspension.isSuspended": false,
            "suspension.suspendedAt": null,
            "suspension.reason": null,
          },
        }
      );

      processed += result.modifiedCount;
      console.log(
        `✅ Processed ${processed}/${usersWithoutSuspension.length} users`
      );
    }

    console.log(`\n🎯 Migration completed successfully!`);
    console.log(`📊 Total users updated: ${processed}`);

    // Verify migration
    const usersStillMissing = await User.find({
      suspension: { $exists: false },
    });

    if (usersStillMissing.length === 0) {
      console.log(
        "✅ Verification passed - all users now have suspension field"
      );
    } else {
      console.log(
        `❌ Verification failed - ${usersStillMissing.length} users still missing suspension field`
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

async function rollbackMigration() {
  console.log(
    "🔄 Rolling back User Schema Migration - Removing Suspension Field\n"
  );

  try {
    const result = await User.updateMany(
      { suspension: { $exists: true } },
      { $unset: { suspension: 1 } }
    );

    console.log(
      `✅ Rollback completed - removed suspension field from ${result.modifiedCount} users`
    );
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  }
}

async function checkMigrationStatus() {
  console.log("🔍 Checking User Schema Migration Status\n");

  try {
    const totalUsers = await User.countDocuments({});
    const usersWithSuspension = await User.countDocuments({
      suspension: { $exists: true },
    });
    const usersWithoutSuspension = await User.countDocuments({
      suspension: { $exists: false },
    });

    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`✅ Users with suspension field: ${usersWithSuspension}`);
    console.log(`❌ Users without suspension field: ${usersWithoutSuspension}`);

    if (usersWithoutSuspension === 0) {
      console.log("\n🎯 Migration Status: COMPLETED ✅");
    } else {
      console.log("\n⚠️  Migration Status: INCOMPLETE - Run migration");
    }

    // Show sample of users with suspension field
    if (usersWithSuspension > 0) {
      console.log("\n📋 Sample user with suspension field:");
      const sampleUser = await User.findOne({ suspension: { $exists: true } })
        .select("firstName lastName email suspension")
        .lean();

      console.log(JSON.stringify(sampleUser, null, 2));
    }
  } catch (error) {
    console.error("❌ Status check failed:", error);
  }
}

async function main() {
  await connectDB();

  const command = process.argv[2];

  try {
    switch (command) {
      case "migrate":
        await migrateUserSuspension();
        break;
      case "rollback":
        await rollbackMigration();
        break;
      case "status":
        await checkMigrationStatus();
        break;
      default:
        console.log("Usage:");
        console.log(
          "  node -r dotenv/config src/scripts/migrations/migrate-user-suspension.js migrate"
        );
        console.log(
          "  node -r dotenv/config src/scripts/migrations/migrate-user-suspension.js rollback"
        );
        console.log(
          "  node -r dotenv/config src/scripts/migrations/migrate-user-suspension.js status"
        );
    }
  } catch (error) {
    console.error("❌ Operation failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the migration
main().catch(console.error);
