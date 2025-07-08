import { NextResponse } from "next/server";
import User from "@/lib/models/userSchema";
import connectDB from "@/lib/db";

const migrateBadgesFromUsers = async () => {
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

export async function POST() {
  try {
    console.log("Badge migration API called");

    const result = await migrateBadgesFromUsers();

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: result,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in badge migration API:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Badge migration API error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: "Badge migration endpoint ready. Use POST to run migration.",
    endpoint: "/api/migrate-badges",
  });
}
