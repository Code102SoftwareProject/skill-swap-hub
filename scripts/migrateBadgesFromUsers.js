import mongoose from "mongoose";
import User from "@/lib/models/userSchema";
import connectDB from "@/lib/db";

/**
 * Migration script to remove badges field from existing user documents
 * Run this once to clean up existing user documents
 */
export const migrateBadgesFromUsers = async () => {
  try {
    await connectDB();

    console.log("🔄 Starting badges field migration...");

    // Remove badges field from all user documents
    const result = await User.updateMany(
      {}, // Match all documents
      { $unset: { badges: "" } } // Remove badges field
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Updated ${result.modifiedCount} user documents`);

    return {
      success: true,
      message: `Migration completed. Updated ${result.modifiedCount} users.`,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return {
      success: false,
      message: "Migration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateBadgesFromUsers()
    .then((result) => {
      console.log("Migration result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration error:", error);
      process.exit(1);
    });
}
