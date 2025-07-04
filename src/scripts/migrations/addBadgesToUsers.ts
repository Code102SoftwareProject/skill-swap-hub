import mongoose from "mongoose";
import User from "../../lib/models/userSchema";
import dbConnect from "../../lib/db";

/**
 * Migration script to add badges field to existing users
 * This ensures all existing users have the new badges array field
 */
async function addBadgesToExistingUsers() {
  try {
    console.log(
      "🚀 Starting migration: Adding badges field to existing users..."
    );

    // Connect to database
    await dbConnect();

    // Update all users that don't have a badges field
    const result = await User.updateMany(
      { badges: { $exists: false } }, // Find users without badges field
      { $set: { badges: [] } } // Set badges to empty array
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Updated ${result.modifiedCount} users with badges field`);

    // Also update users that have null badges
    const nullBadgesResult = await User.updateMany(
      { badges: null },
      { $set: { badges: [] } }
    );

    console.log(
      `📊 Updated ${nullBadgesResult.modifiedCount} users with null badges`
    );

    // Verify the migration
    const totalUsers = await User.countDocuments();
    const usersWithBadges = await User.countDocuments({
      badges: { $exists: true, $ne: null },
    });

    console.log(`📈 Verification:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with badges field: ${usersWithBadges}`);

    if (totalUsers === usersWithBadges) {
      console.log("✅ All users now have the badges field!");
    } else {
      console.log("⚠️  Some users might still be missing the badges field");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addBadgesToExistingUsers()
    .then(() => {
      console.log("🎉 Migration script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

export default addBadgesToExistingUsers;
