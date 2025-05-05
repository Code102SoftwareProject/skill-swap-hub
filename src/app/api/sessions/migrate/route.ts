import { NextResponse } from "next/server";
import connect from "@/lib/db";
import Session from "@/lib/models/sessionSchema";
import SessionProgress from "@/lib/models/sessionProgressSchema";

/**
 * Migrates Session data to the new schema structure
 * Deletes all existing session data as there's currently no data to preserve
 */
export async function GET() {
  try {
    // Connect to database
    await connect();
    
    console.log("Starting session migration...");
    
    // Get count before deletion for reporting
    const beforeCount = await Session.countDocuments();
    console.log(`Found ${beforeCount} session documents before migration`);
    
    // Delete all existing sessions
    const deleteResult = await Session.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} session documents`);
    
    // Also delete any session progress documents to ensure clean slate
    const progressDeleteResult = await SessionProgress.deleteMany({});
    console.log(`Deleted ${progressDeleteResult.deletedCount} session progress documents`);
    
    return NextResponse.json({
      success: true,
      message: "Session migration completed successfully",
      deletedSessions: deleteResult.deletedCount,
      deletedProgress: progressDeleteResult.deletedCount
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error during session migration:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to migrate session data",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}