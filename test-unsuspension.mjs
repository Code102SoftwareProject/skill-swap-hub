import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Test script to verify unsuspension process
async function testUnsuspensionProcess() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/skillswaphub";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log("🔍 Testing unsuspension process...");

    // Check if we have any suspended users
    const suspendedUsers = await db
      .collection("suspended_users")
      .find({})
      .toArray();
    console.log(`📊 Found ${suspendedUsers.length} suspended users`);

    if (suspendedUsers.length > 0) {
      const testUser = suspendedUsers[0];
      console.log(
        `👤 Test user: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`
      );
      console.log(`🔑 Has password: ${!!testUser.password}`);
      console.log(`📅 Originally created: ${testUser.originalCreatedAt}`);
      console.log(`🚫 Suspended: ${testUser.suspendedAt}`);
      console.log(`📝 Reason: ${testUser.suspensionReason}`);

      // Verify the user is not in the main users collection
      const existingUser = await db
        .collection("users")
        .findOne({ email: testUser.email });
      console.log(`✅ User exists in main collection: ${!!existingUser}`);

      if (!existingUser) {
        console.log(
          "✅ Suspension process is working correctly - user is not in main collection"
        );
      } else {
        console.log("❌ Issue: User exists in both collections");
      }
    } else {
      console.log("ℹ️ No suspended users found to test");
    }

    // Check for any recently unsuspended users
    const recentUsers = await db
      .collection("users")
      .find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    console.log(`\n🔍 Recent users in main collection: ${recentUsers.length}`);
    recentUsers.forEach((user, i) => {
      console.log(
        `${i + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Updated: ${user.updatedAt}`
      );
    });

    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("❌ Error testing unsuspension process:", error);
  } finally {
    await client.close();
  }
}

// Run the test
testUnsuspensionProcess().catch(console.error);
