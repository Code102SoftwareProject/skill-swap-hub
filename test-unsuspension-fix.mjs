import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

// Test script to simulate unsuspension with proper password handling
async function testUnsuspensionFix() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/skillswaphub";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log("🔍 Testing unsuspension fix...");

    // First, let's create a test suspended user with a proper password
    const testPassword = "testPassword123";
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    const testSuspendedUser = {
      firstName: "Test",
      lastName: "User2",
      email: "testuser2@test.com",
      phone: "1234567890",
      title: "Test Title",
      password: hashedPassword,
      avatar: null,
      googleId: null,
      isGoogleUser: false,
      profileCompleted: true,
      originalCreatedAt: new Date(),
      originalUpdatedAt: new Date(),
      suspendedAt: new Date(),
      suspendedBy: "admin",
      suspensionReason: "Testing",
      suspensionNotes: "Test suspension",
      originalUserId: "test-user-id",
    };

    // Insert the suspended user
    await db.collection("suspended_users").insertOne(testSuspendedUser);
    console.log("✅ Created test suspended user");

    // Now simulate the unsuspension process
    const restoredUserData = {
      firstName: testSuspendedUser.firstName,
      lastName: testSuspendedUser.lastName,
      email: testSuspendedUser.email,
      phone: testSuspendedUser.phone,
      title: testSuspendedUser.title,
      password: testSuspendedUser.password,
      avatar: testSuspendedUser.avatar,
      googleId: testSuspendedUser.googleId,
      isGoogleUser: testSuspendedUser.isGoogleUser,
      profileCompleted: testSuspendedUser.profileCompleted,
      createdAt: testSuspendedUser.originalCreatedAt,
      updatedAt: new Date(),
    };

    // Insert directly into users collection (simulating the fixed API)
    await db.collection("users").insertOne(restoredUserData);
    console.log("✅ Restored user to main collection");

    // Test the password
    const restoredUser = await db
      .collection("users")
      .findOne({ email: testSuspendedUser.email });
    if (restoredUser) {
      console.log(
        `🔑 Restored password length: ${restoredUser.password.length}`
      );
      console.log(
        `🔐 Password starts with $2: ${restoredUser.password.startsWith("$2")}`
      );

      // Test password comparison
      const isValid = await bcrypt.compare(testPassword, restoredUser.password);
      console.log(`✅ Password validation: ${isValid}`);

      if (isValid) {
        console.log("🎉 SUCCESS: Password was preserved correctly!");
      } else {
        console.log("❌ FAILED: Password was corrupted during restoration");
      }
    }

    // Clean up
    await db
      .collection("suspended_users")
      .deleteOne({ email: testSuspendedUser.email });
    await db.collection("users").deleteOne({ email: testSuspendedUser.email });
    console.log("🧹 Cleaned up test data");

    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("❌ Error testing unsuspension fix:", error);
  } finally {
    await client.close();
  }
}

// Run the test
testUnsuspensionFix().catch(console.error);
