// Test creating a user with the updated schema
// Run with: node -r dotenv/config scripts/testUserCreation.mjs

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Define User schema directly to avoid ES module issues
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true, trim: true },
    phone: { type: String, required: true },
    title: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: "badge" }],
    suspension: {
      isSuspended: { type: Boolean, default: false },
      suspendedAt: { type: Date },
      reason: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/skillswaphub"
    );
    console.log("✅ Connected to MongoDB");
    console.log(`📍 Connected to database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function testUserCreation() {
  console.log("🧪 Testing User Creation with Suspension Field\n");

  try {
    // Check existing users first
    const existingUserCount = await User.countDocuments();
    console.log(`📊 Existing users in database: ${existingUserCount}`);

    if (existingUserCount > 0) {
      console.log("\n🔍 Checking existing users for suspension field:");

      const usersWithSuspension = await User.countDocuments({
        suspension: { $exists: true },
      });
      const usersWithoutSuspension = await User.countDocuments({
        suspension: { $exists: false },
      });

      console.log(`✅ Users with suspension field: ${usersWithSuspension}`);
      console.log(
        `❌ Users without suspension field: ${usersWithoutSuspension}`
      );

      if (usersWithoutSuspension > 0) {
        console.log("\n⚠️  MIGRATION NEEDED for existing users!");

        // Show sample user without suspension
        const sampleUser = await User.findOne({
          suspension: { $exists: false },
        })
          .select("firstName lastName email suspension")
          .lean();

        if (sampleUser) {
          console.log("📋 Sample user without suspension field:");
          console.log(JSON.stringify(sampleUser, null, 2));
        }
      }

      // Show sample user with suspension field
      const userWithSuspension = await User.findOne({
        suspension: { $exists: true },
      })
        .select("firstName lastName email suspension")
        .lean();

      if (userWithSuspension) {
        console.log("\n📋 Sample user with suspension field:");
        console.log(JSON.stringify(userWithSuspension, null, 2));
      }
    }

    // Test creating a new user
    console.log("\n🆕 Testing new user creation:");

    const testEmail = `test-user-${Date.now()}@example.com`;
    const newUser = new User({
      firstName: "Test",
      lastName: "User",
      email: testEmail,
      phone: "1234567890",
      title: "Test Developer",
      password: "hashedpassword123",
    });

    console.log("📋 New user before save:");
    console.log("suspension field:", newUser.suspension);

    // Save the test user
    const savedUser = await newUser.save();
    console.log("✅ User created successfully");
    console.log("📋 Saved user suspension field:", savedUser.suspension);

    // Verify the user was saved with correct suspension field
    const retrievedUser = await User.findById(savedUser._id).lean();
    console.log(
      "📋 Retrieved user suspension field:",
      retrievedUser.suspension
    );

    // Test suspension update
    console.log("\n🔒 Testing suspension update:");
    savedUser.suspension.isSuspended = true;
    savedUser.suspension.suspendedAt = new Date();
    savedUser.suspension.reason = "Test suspension";

    await savedUser.save();
    console.log("✅ User suspended successfully");

    const suspendedUser = await User.findById(savedUser._id).lean();
    console.log("📋 Suspended user:", suspendedUser.suspension);

    // Clean up - delete test user
    await User.findByIdAndDelete(savedUser._id);
    console.log("🧹 Test user cleaned up");

    console.log("\n🎯 User creation and suspension testing completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function main() {
  await connectDB();

  try {
    await testUserCreation();
  } catch (error) {
    console.error("❌ Testing failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

main().catch(console.error);
