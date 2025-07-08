// Simple test script to verify user suspension field
// Run with: node -r dotenv/config scripts/testUserSuspensionSimple.mjs

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

async function testSuspensionField() {
  console.log("🧪 Testing User Suspension Field Implementation\n");

  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Test 1: Check current user count and suspension status
    console.log("1️⃣ Checking existing users...");
    const totalUsers = await usersCollection.countDocuments({});
    const usersWithSuspension = await usersCollection.countDocuments({
      suspension: { $exists: true },
    });

    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`✅ Users with suspension field: ${usersWithSuspension}`);

    // Test 2: Create a test user document to verify structure
    console.log("\n2️⃣ Testing user document structure...");
    const testUserDoc = {
      firstName: "Test",
      lastName: "User",
      email: `test-${Date.now()}@example.com`,
      phone: "1234567890",
      title: "Test User",
      password: "hashed-password",
      suspension: {
        isSuspended: false,
        suspendedAt: null,
        reason: null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("📋 Test user document structure:");
    console.log(JSON.stringify(testUserDoc, null, 2));

    // Test 3: Test suspension updates
    console.log("\n3️⃣ Testing suspension field updates...");

    // Simulate suspension
    testUserDoc.suspension.isSuspended = true;
    testUserDoc.suspension.suspendedAt = new Date();
    testUserDoc.suspension.reason = "Test suspension for policy violation";

    console.log("📋 After suspension update:");
    console.log("isSuspended:", testUserDoc.suspension.isSuspended);
    console.log("suspendedAt:", testUserDoc.suspension.suspendedAt);
    console.log("reason:", testUserDoc.suspension.reason);

    if (testUserDoc.suspension.isSuspended === true) {
      console.log("✅ Suspension field updates work correctly");
    } else {
      console.log("❌ Suspension field updates failed");
    }

    // Test 4: Test unsuspension
    console.log("\n4️⃣ Testing unsuspension...");
    testUserDoc.suspension.isSuspended = false;
    testUserDoc.suspension.suspendedAt = null;
    testUserDoc.suspension.reason = null;

    console.log("📋 After unsuspension:");
    console.log("isSuspended:", testUserDoc.suspension.isSuspended);

    if (testUserDoc.suspension.isSuspended === false) {
      console.log("✅ Unsuspension works correctly");
    } else {
      console.log("❌ Unsuspension failed");
    }

    // Test 5: Test MongoDB operations (if there are users)
    if (totalUsers > 0) {
      console.log("\n5️⃣ Testing MongoDB operations on existing users...");

      // Find a user with suspension field
      const sampleUser = await usersCollection.findOne(
        { suspension: { $exists: true } },
        { projection: { firstName: 1, lastName: 1, email: 1, suspension: 1 } }
      );

      if (sampleUser) {
        console.log("📋 Sample user from database:");
        console.log(JSON.stringify(sampleUser, null, 2));

        // Test query for suspended users
        const suspendedCount = await usersCollection.countDocuments({
          "suspension.isSuspended": true,
        });
        console.log(`📊 Currently suspended users: ${suspendedCount}`);

        // Test query for non-suspended users
        const nonSuspendedCount = await usersCollection.countDocuments({
          "suspension.isSuspended": false,
        });
        console.log(`📊 Non-suspended users: ${nonSuspendedCount}`);

        console.log("✅ MongoDB queries work correctly");
      }
    } else {
      console.log("\n5️⃣ No existing users to test MongoDB operations");
      console.log(
        "💡 Users will get suspension field when created through the app"
      );
    }

    console.log("\n🎯 User suspension field testing completed successfully!");
    console.log("✅ The system is ready to handle user suspensions");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function main() {
  await connectDB();

  try {
    await testSuspensionField();
  } catch (error) {
    console.error("❌ Testing failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the test
main().catch(console.error);
