import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Test script to check for users that might have corrupted passwords
async function checkCorruptedPasswords() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/skillswaphub";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log(
      "🔍 Checking for users with potentially corrupted passwords..."
    );

    // Find users with very long passwords (likely double-hashed)
    const users = await db
      .collection("users")
      .find({ password: { $exists: true } })
      .toArray();

    console.log(`📊 Found ${users.length} users with passwords`);

    for (const user of users) {
      const passwordLength = user.password ? user.password.length : 0;
      const isProperBcrypt = user.password && user.password.startsWith("$2");

      console.log(`👤 ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Password length: ${passwordLength}`);
      console.log(`   Proper bcrypt format: ${isProperBcrypt}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);

      // Check if password is suspiciously long (double-hashed)
      if (passwordLength > 80) {
        console.log(
          `   ⚠️  SUSPICIOUS: Password is very long (${passwordLength} chars) - might be double-hashed`
        );
      }

      console.log("");
    }

    console.log("\n✅ Check completed");
  } catch (error) {
    console.error("❌ Error checking passwords:", error);
  } finally {
    await client.close();
  }
}

// Run the check
checkCorruptedPasswords().catch(console.error);
