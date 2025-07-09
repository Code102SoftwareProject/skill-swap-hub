// Database exploration script to see collections and data
// Run with: node -r dotenv/config scripts/exploreDatabase.mjs

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

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

async function exploreDatabase() {
  console.log("🔍 Exploring Database Structure\n");

  try {
    const db = mongoose.connection.db;

    // List all collections
    console.log("📋 Available collections:");
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log("❌ No collections found in the database");
      return;
    }

    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      console.log(`  📁 ${collectionName}: ${count} documents`);
    }

    // Check users collection specifically
    console.log("\n👥 Examining users collection in detail:");
    const usersCollection = db.collection("users");
    const userCount = await usersCollection.countDocuments();

    if (userCount > 0) {
      console.log(`📊 Total users: ${userCount}`);

      // Check for suspension field
      const usersWithSuspension = await usersCollection.countDocuments({
        suspension: { $exists: true },
      });
      const usersWithoutSuspension = await usersCollection.countDocuments({
        suspension: { $exists: false },
      });

      console.log(`✅ Users with suspension field: ${usersWithSuspension}`);
      console.log(
        `❌ Users without suspension field: ${usersWithoutSuspension}`
      );

      // Show sample user
      console.log("\n👤 Sample user document:");
      const sampleUser = await usersCollection.findOne(
        {},
        {
          projection: {
            firstName: 1,
            lastName: 1,
            email: 1,
            suspension: 1,
            createdAt: 1,
            _id: 1,
          },
        }
      );
      console.log(JSON.stringify(sampleUser, null, 2));

      if (usersWithoutSuspension > 0) {
        console.log("\n⚠️  MIGRATION NEEDED!");
        console.log("💡 Run: npm run migrate:user-suspension");
      } else {
        console.log("\n✅ All users have suspension field");
      }
    } else {
      console.log("📭 No users found in database");
    }

    // Check other relevant collections
    console.log("\n📋 Checking other relevant collections:");

    const reportInSessions = await db
      .collection("reportinsessions")
      .countDocuments();
    console.log(`📑 Report in sessions: ${reportInSessions}`);

    const sessions = await db.collection("sessions").countDocuments();
    console.log(`🔗 Sessions: ${sessions}`);

    const admins = await db.collection("admins").countDocuments();
    console.log(`👨‍💼 Admins: ${admins}`);
  } catch (error) {
    console.error("❌ Database exploration failed:", error);
  }
}

async function main() {
  await connectDB();

  try {
    await exploreDatabase();
  } catch (error) {
    console.error("❌ Exploration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the exploration
main().catch(console.error);
