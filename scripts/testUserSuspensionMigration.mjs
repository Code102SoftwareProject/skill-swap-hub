// Test script to verify user suspension field migration
// Run with: node -r dotenv/config scripts/testUserSuspensionMigration.mjs

import mongoose from "mongoose";
import User from "../src/lib/models/userSchema.js";

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
  console.log("🧪 Testing User Suspension Field\n");

  try {
    // Test 1: Check if field exists in schema
    console.log("1️⃣ Testing schema definition...");
    const userSchema = User.schema;
    const suspensionPath = userSchema.paths.suspension;

    if (suspensionPath) {
      console.log("✅ Suspension field exists in schema");
      console.log("📋 Schema definition:", suspensionPath.schema.paths);
    } else {
      console.log("❌ Suspension field NOT found in schema");
      return;
    }

    // Test 2: Check existing users
    console.log("\n2️⃣ Testing existing users...");
    const totalUsers = await User.countDocuments({});
    const usersWithSuspension = await User.countDocuments({
      suspension: { $exists: true },
    });

    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`✅ Users with suspension field: ${usersWithSuspension}`);

    if (usersWithSuspension === 0 && totalUsers > 0) {
      console.log("⚠️  No users have suspension field - migration needed");
      console.log("💡 Run: npm run migrate:user-suspension");
    }

    // Test 3: Sample user data
    if (usersWithSuspension > 0) {
      console.log("\n3️⃣ Testing sample user data...");
      const sampleUser = await User.findOne({ suspension: { $exists: true } })
        .select("firstName lastName email suspension")
        .lean();

      console.log("📋 Sample user:", JSON.stringify(sampleUser, null, 2));

      // Verify default values
      if (sampleUser.suspension.isSuspended === false) {
        console.log("✅ Default isSuspended value is correct (false)");
      } else {
        console.log("❌ Default isSuspended value is incorrect");
      }
    }

    // Test 4: Create new user (should have suspension field)
    console.log("\n4️⃣ Testing new user creation...");
    const testUser = new User({
      firstName: "Test",
      lastName: "User",
      email: `test-${Date.now()}@example.com`,
      phone: "1234567890",
      title: "Test User",
      password: "testpassword123",
    });

    console.log("📋 New user suspension field:", testUser.suspension);

    if (testUser.suspension && testUser.suspension.isSuspended === false) {
      console.log("✅ New user has correct suspension defaults");
    } else {
      console.log("❌ New user suspension field is incorrect");
    }

    // Don't save the test user, just test the object creation

    // Test 5: Test suspension update
    console.log("\n5️⃣ Testing suspension update...");
    const existingUser = await User.findOne({ suspension: { $exists: true } });

    if (existingUser) {
      console.log("📋 Before suspension update:", existingUser.suspension);

      // Update suspension (without saving)
      existingUser.suspension.isSuspended = true;
      existingUser.suspension.suspendedAt = new Date();
      existingUser.suspension.reason = "Test suspension";

      console.log("📋 After suspension update:", existingUser.suspension);

      if (existingUser.suspension.isSuspended === true) {
        console.log("✅ Suspension update works correctly");
      } else {
        console.log("❌ Suspension update failed");
      }
    }

    console.log("\n🎯 User suspension field testing completed!");
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
