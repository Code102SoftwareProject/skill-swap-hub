// Simple migration script for user suspension field
// This script directly connects to MongoDB and updates users
// Run with: node -r dotenv/config scripts/migrateUserSuspension.mjs

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/skillswaphub",
      {
        dbName: "skillSwapHub", // Explicitly set the database name
        bufferCommands: true,
      }
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
    // Get the users collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Count total users
    const totalUsers = await usersCollection.countDocuments({});
    console.log(`📊 Total users in database: ${totalUsers}`);

    // Find users without suspension field
    const usersWithoutSuspension = await usersCollection.countDocuments({
      suspension: { $exists: false },
    });

    console.log(`🔍 Users without suspension field: ${usersWithoutSuspension}`);

    if (usersWithoutSuspension === 0) {
      console.log(
        "✅ All users already have suspension field - no migration needed"
      );
      return;
    }

    // Update users without suspension field
    const result = await usersCollection.updateMany(
      { suspension: { $exists: false } },
      {
        $set: {
          "suspension.isSuspended": false,
          "suspension.suspendedAt": null,
          "suspension.reason": null,
        },
      }
    );

    console.log(`\n🎯 Migration completed successfully!`);
    console.log(`📊 Total users updated: ${result.modifiedCount}`);

    // Verify migration
    const usersStillMissing = await usersCollection.countDocuments({
      suspension: { $exists: false },
    });

    if (usersStillMissing === 0) {
      console.log(
        "✅ Verification passed - all users now have suspension field"
      );
    } else {
      console.log(
        `❌ Verification failed - ${usersStillMissing} users still missing suspension field`
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

async function checkMigrationStatus() {
  console.log("🔍 Checking User Schema Migration Status\n");

  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const totalUsers = await usersCollection.countDocuments({});
    const usersWithSuspension = await usersCollection.countDocuments({
      suspension: { $exists: true },
    });
    const usersWithoutSuspension = await usersCollection.countDocuments({
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
      const sampleUser = await usersCollection.findOne(
        { suspension: { $exists: true } },
        { projection: { firstName: 1, lastName: 1, email: 1, suspension: 1 } }
      );

      console.log(JSON.stringify(sampleUser, null, 2));
    }
  } catch (error) {
    console.error("❌ Status check failed:", error);
  }
}

async function rollbackMigration() {
  console.log(
    "🔄 Rolling back User Schema Migration - Removing Suspension Field\n"
  );

  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const result = await usersCollection.updateMany(
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
          "  node -r dotenv/config scripts/migrateUserSuspension.mjs migrate"
        );
        console.log(
          "  node -r dotenv/config scripts/migrateUserSuspension.mjs rollback"
        );
        console.log(
          "  node -r dotenv/config scripts/migrateUserSuspension.mjs status"
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
