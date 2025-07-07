import mongoose from "mongoose";
import User from "@/lib/models/userSchema";
import Session from "@/lib/models/sessionSchema";
import BadgeAssignment from "@/lib/models/badgeAssignmentSchema";
import connectDB from "@/lib/db";

// Badge ID for "First Exchange" badge
const FIRST_EXCHANGE_BADGE_ID = "680df3defd484f2907e29af3";

/**
 * Assigns "First Exchange" badge to users who have completed their first session
 */
export const assignFirstExchangeBadge = async () => {
  try {
    console.log("Starting First Exchange badge assignment...");
    
    // Find all users who have completed at least one session
    const usersWithCompletedSessions = await Session.aggregate([
      {
        $match: { status: "completed" }
      },
      {
        $group: {
          _id: null,
          user1Ids: { $addToSet: "$user1Id" },
          user2Ids: { $addToSet: "$user2Id" }
        }
      },
      {
        $project: {
          allUserIds: { $setUnion: ["$user1Ids", "$user2Ids"] }
        }
      }
    ]);

    if (!usersWithCompletedSessions.length || !usersWithCompletedSessions[0].allUserIds) {
      console.log("No users with completed sessions found");
      return { success: true, message: "No users with completed sessions found", assignedCount: 0 };
    }

    const eligibleUserIds = usersWithCompletedSessions[0].allUserIds;
    console.log(`Found ${eligibleUserIds.length} users with completed sessions`);

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(FIRST_EXCHANGE_BADGE_ID)
    }).select('userId');

    const usersWithBadge = existingAssignments.map(assignment => assignment.userId.toString());
    
    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) => !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log("All eligible users already have the First Exchange badge");
      return { success: true, message: "All eligible users already have the badge", assignedCount: 0 };
    }

    console.log(`Assigning First Exchange badge to ${usersToAssignBadge.length} users`);

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map((userId: mongoose.Types.ObjectId) => ({
      userId: new mongoose.Types.ObjectId(userId),
      badgeId: new mongoose.Types.ObjectId(FIRST_EXCHANGE_BADGE_ID),
      assignmentContext: "session_completed",
      assignedAt: new Date()
    }));

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(badgeAssignments, { ordered: false });

    // Update user documents to include the badge in their badges array
    await User.updateMany(
      { _id: { $in: usersToAssignBadge } },
      { $addToSet: { badges: new mongoose.Types.ObjectId(FIRST_EXCHANGE_BADGE_ID) } }
    );

    console.log(`Successfully assigned First Exchange badge to ${assignmentResults.length} users`);
    
    return {
      success: true,
      message: `First Exchange badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge
    };

  } catch (error) {
    console.error("Error assigning First Exchange badge:", error);
    return {
      success: false,
      message: "Failed to assign First Exchange badge",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Main function to assign all eligible badges
 * Currently only handles First Exchange badge
 */
export const assignAllEligibleBadges = async () => {
  try {
    await connectDB();
    
    console.log("Starting badge assignment process...");
    
    const results = {
      success: true,
      totalAssigned: 0,
      badgeResults: {} as Record<string, any>
    };

    // Assign First Exchange badge
    const firstExchangeResult = await assignFirstExchangeBadge();
    results.badgeResults.firstExchange = firstExchangeResult;
    
    if (firstExchangeResult.success) {
      results.totalAssigned += firstExchangeResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    console.log(`Badge assignment process completed. Total badges assigned: ${results.totalAssigned}`);
    
    return results;

  } catch (error) {
    console.error("Error in badge assignment process:", error);
    return {
      success: false,
      message: "Badge assignment process failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
