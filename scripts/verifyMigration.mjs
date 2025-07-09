import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

const client = new MongoClient(uri);

async function verifyMigration() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const database = client.db("skillSwapHub");
    const usersCollection = database.collection("users");

    // Check overall stats
    const totalUsers = await usersCollection.countDocuments();
    const usersWithSuspension = await usersCollection.countDocuments({
      suspension: { $exists: true },
    });
    const suspendedUsers = await usersCollection.countDocuments({
      "suspension.isSuspended": true,
    });

    console.log("📊 Migration Verification Results:");
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with suspension field: ${usersWithSuspension}`);
    console.log(`   Currently suspended users: ${suspendedUsers}`);

    // Show sample users with suspension field
    console.log("\n📋 Sample users with suspension field:");
    const sampleUsers = await usersCollection
      .find(
        { suspension: { $exists: true } },
        {
          projection: {
            firstName: 1,
            lastName: 1,
            email: 1,
            suspension: 1,
          },
          limit: 3,
        }
      )
      .toArray();

    sampleUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`
      );
      console.log(`      Suspended: ${user.suspension.isSuspended}`);
      console.log(`      Reason: ${user.suspension.reason || "N/A"}`);
      console.log(
        `      Suspended At: ${user.suspension.suspendedAt || "N/A"}`
      );
    });

    // Test the suspension field structure
    console.log("\n🔬 Testing suspension field structure:");
    const testUser = await usersCollection.findOne({
      suspension: { $exists: true },
    });
    const suspensionField = testUser.suspension;

    console.log("   ✅ Suspension field structure:");
    console.log(
      `      isSuspended: ${typeof suspensionField.isSuspended} (${suspensionField.isSuspended})`
    );
    console.log(
      `      reason: ${typeof suspensionField.reason} (${suspensionField.reason})`
    );
    console.log(
      `      suspendedAt: ${typeof suspensionField.suspendedAt} (${suspensionField.suspendedAt})`
    );

    if (totalUsers === usersWithSuspension) {
      console.log(
        "\n✅ MIGRATION SUCCESSFUL - All users have suspension field!"
      );
    } else {
      console.log(
        "\n❌ MIGRATION INCOMPLETE - Some users missing suspension field"
      );
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Database connection closed");
  }
}

verifyMigration();
