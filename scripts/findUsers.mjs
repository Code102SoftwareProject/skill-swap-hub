// Find all collections and their structure
// Run with: node -r dotenv/config scripts/findUsers.mjs

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

async function findAllCollections() {
  console.log("🔍 Finding all collections and checking for user data\n");

  try {
    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections:`);

    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      console.log(`\n📁 Collection: ${collectionName} (${count} documents)`);

      if (count > 0) {
        // Get a sample document to see the structure
        const sample = await db.collection(collectionName).findOne({});

        // Check if this might be a users collection
        const hasUserFields =
          sample &&
          (sample.firstName || sample.email || sample.username || sample.name);

        if (hasUserFields) {
          console.log("👤 This looks like a user collection!");
          console.log("📋 Sample document structure:");

          // Show relevant fields
          const relevantFields = {};
          [
            "_id",
            "firstName",
            "lastName",
            "email",
            "username",
            "name",
            "suspension",
            "createdAt",
          ].forEach((field) => {
            if (sample[field] !== undefined) {
              relevantFields[field] = sample[field];
            }
          });

          console.log(JSON.stringify(relevantFields, null, 2));

          // Check suspension field specifically
          if (sample.suspension) {
            console.log("✅ Has suspension field");
          } else {
            console.log("❌ Missing suspension field - NEEDS MIGRATION");
          }
        } else {
          console.log(
            "📋 Sample fields:",
            Object.keys(sample).slice(0, 5).join(", ")
          );
        }
      }
    }

    // Try common user collection names
    const possibleUserCollections = [
      "users",
      "user",
      "User",
      "Users",
      "accounts",
      "members",
    ];

    console.log("\n🔍 Checking common user collection names:");
    for (const collectionName of possibleUserCollections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`  ${collectionName}: ${count} documents`);

        if (count > 0) {
          const sample = await db.collection(collectionName).findOne({});
          const hasSuspension = sample && sample.suspension;
          console.log(
            `    Has suspension field: ${hasSuspension ? "✅" : "❌"}`
          );
        }
      } catch (error) {
        // Collection doesn't exist, skip
      }
    }
  } catch (error) {
    console.error("❌ Error finding collections:", error);
  }
}

async function main() {
  await connectDB();

  try {
    await findAllCollections();
  } catch (error) {
    console.error("❌ Operation failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

main().catch(console.error);
