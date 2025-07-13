import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

// Test script to verify login credentials for unsuspended users
async function testLoginCredentials() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/skillswaphub";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log("🔍 Testing login credentials for unsuspended users...");

    // Get the recently unsuspended user
    const user = await db
      .collection("users")
      .findOne({ email: "suspended@test.com" });

    if (user) {
      console.log(
        `👤 Found user: ${user.firstName} ${user.lastName} (${user.email})`
      );
      console.log(`🔑 Has password field: ${!!user.password}`);
      console.log(
        `📏 Password length: ${user.password ? user.password.length : 0}`
      );
      console.log(
        `🔐 Password starts with $2: ${user.password ? user.password.startsWith("$2") : false}`
      );
      console.log(`📅 Created: ${user.createdAt}`);
      console.log(`🔄 Updated: ${user.updatedAt}`);
      console.log(`👤 Google User: ${user.isGoogleUser}`);
      console.log(`✅ Profile Completed: ${user.profileCompleted}`);

      // Test password comparison (if password exists)
      if (user.password) {
        const testPassword = "password123"; // Common test password
        const testPassword2 = "test123"; // Another common test password

        try {
          const isValid1 = await bcrypt.compare(testPassword, user.password);
          const isValid2 = await bcrypt.compare(testPassword2, user.password);
          console.log(`🔓 Password 'password123' is valid: ${isValid1}`);
          console.log(`🔓 Password 'test123' is valid: ${isValid2}`);
        } catch (error) {
          console.log(`❌ Error comparing passwords: ${error.message}`);
        }
      }
    } else {
      console.log("❌ User not found");
    }

    console.log("\n✅ Test completed");
  } catch (error) {
    console.error("❌ Error testing login credentials:", error);
  } finally {
    await client.close();
  }
}

// Run the test
testLoginCredentials().catch(console.error);
