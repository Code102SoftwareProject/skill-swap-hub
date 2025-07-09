import mongoose from "mongoose";
import User from "@/lib/models/userSchema";
import Session from "@/lib/models/sessionSchema";
import UserSkill from "@/lib/models/userSkill";
import BadgeAssignment from "@/lib/models/badgeAssignmentSchema";
import connectDB from "@/lib/db";

// Badge ID for "First Exchange" badge
const FIRST_EXCHANGE_BADGE_ID = "680df3defd484f2907e29af3";

// Badge ID for "Five Skill Sessions" badge
const FIVE_SKILL_SESSIONS_BADGE_ID = "680e0965b75cb50846041c19";

// Badge ID for "Ten Skill Sessions" badge
const TEN_SKILL_SESSIONS_BADGE_ID = "680e0af268a1e3a9a89b27d5";

// Badge ID for "Twenty-Five Skill Sessions" badge
const TWENTY_FIVE_SKILL_SESSIONS_BADGE_ID = "6811cc1fac3e31d97db04750";

// Badge ID for "Fifty Skill Sessions" badge
const FIFTY_SKILL_SESSIONS_BADGE_ID = "686bfe9aae946b962c3ad374";

// Badge ID for "One Hundred Skill Sessions" badge
const ONE_HUNDRED_SKILL_SESSIONS_BADGE_ID = "686c0085ae946b962c3ad377";

// Badge ID for "Coding Ninja" badge
const CODING_NINJA_BADGE_ID = "680e17eea78e0ba5881d5aef";

// Badge ID for "Art Virtuoso" badge
const ART_VIRTUOSO_BADGE_ID = "680e17eea78e0ba5881d5af0";

// Badge ID for "Trailblazer" badge
const TRAILBLAZER_BADGE_ID = "686cb489fd58fb543041811b";

/**
 * Assigns "First Exchange" badge to users who have completed their first session
 */
export const assignFirstExchangeBadge = async () => {
  try {
    console.log("Starting First Exchange badge assignment...");

    // Find all users who have completed at least one session
    const usersWithCompletedSessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          user1Ids: { $addToSet: "$user1Id" },
          user2Ids: { $addToSet: "$user2Id" },
        },
      },
      {
        $project: {
          allUserIds: { $setUnion: ["$user1Ids", "$user2Ids"] },
        },
      },
    ]);

    if (
      !usersWithCompletedSessions.length ||
      !usersWithCompletedSessions[0].allUserIds
    ) {
      console.log("No users with completed sessions found");
      return {
        success: true,
        message: "No users with completed sessions found",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithCompletedSessions[0].allUserIds;
    console.log(
      `Found ${eligibleUserIds.length} users with completed sessions`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(FIRST_EXCHANGE_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log("All eligible users already have the First Exchange badge");
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning First Exchange badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(FIRST_EXCHANGE_BADGE_ID),
        assignmentContext: "session_completed",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned First Exchange badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `First Exchange badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
    };
  } catch (error) {
    console.error("Error assigning First Exchange badge:", error);
    return {
      success: false,
      message: "Failed to assign First Exchange badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Main function to assign all eligible badges
 * Currently handles First Exchange, Five, Ten, Twenty-Five, Fifty, One Hundred Skill Sessions badges, Coding Ninja badge, Art Virtuoso badge, and Trailblazer badge
 */
export const assignAllEligibleBadges = async () => {
  try {
    await connectDB();

    console.log("Starting badge assignment process...");

    const results = {
      success: true,
      totalAssigned: 0,
      badgeResults: {} as Record<string, any>,
    };

    // Assign First Exchange badge
    const firstExchangeResult = await assignFirstExchangeBadge();
    results.badgeResults.firstExchange = firstExchangeResult;

    if (firstExchangeResult.success) {
      results.totalAssigned += firstExchangeResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    // Assign Five Skill Sessions badge
    const fiveSkillSessionsResult = await assignFiveSkillSessionsBadge();
    results.badgeResults.fiveSkillSessions = fiveSkillSessionsResult;

    if (fiveSkillSessionsResult.success) {
      results.totalAssigned += fiveSkillSessionsResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    // Assign Ten Skill Sessions badge
    const tenSkillSessionsResult = await assignTenSkillSessionsBadge();
    results.badgeResults.tenSkillSessions = tenSkillSessionsResult;

    if (tenSkillSessionsResult.success) {
      results.totalAssigned += tenSkillSessionsResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    // Assign Twenty-Five Skill Sessions badge
    const twentyFiveSkillSessionsResult =
      await assignTwentyFiveSkillSessionsBadge();
    results.badgeResults.twentyFiveSkillSessions =
      twentyFiveSkillSessionsResult;

    if (twentyFiveSkillSessionsResult.success) {
      results.totalAssigned += twentyFiveSkillSessionsResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    // Assign Fifty Skill Sessions badge
    const fiftySkillSessionsResult = await assignFiftySkillSessionsBadge();
    results.badgeResults.fiftySkillSessions = fiftySkillSessionsResult;

    if (fiftySkillSessionsResult.success) {
      results.totalAssigned += fiftySkillSessionsResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    // Assign One Hundred Skill Sessions badge
    const oneHundredSkillSessionsResult =
      await assignOneHundredSkillSessionsBadge();
    results.badgeResults.oneHundredSkillSessions =
      oneHundredSkillSessionsResult;

    if (oneHundredSkillSessionsResult.success) {
      results.totalAssigned += oneHundredSkillSessionsResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    // Assign Coding Ninja badge
    const codingNinjaResult = await assignCodingNinjaBadge();
    results.badgeResults.codingNinja = codingNinjaResult;

    if (codingNinjaResult.success) {
      results.totalAssigned += codingNinjaResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    // Assign Art Virtuoso badge
    const artVirtuosoResult = await assignArtVirtuosoBadge();
    results.badgeResults.artVirtuoso = artVirtuosoResult;

    if (artVirtuosoResult.success) {
      results.totalAssigned += artVirtuosoResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    // Assign Trailblazer badge
    const trailblazerResult = await assignTrailblazerBadge();
    results.badgeResults.trailblazer = trailblazerResult;

    if (trailblazerResult.success) {
      results.totalAssigned += trailblazerResult.assignedCount || 0;
    } else {
      results.success = false;
    }

    console.log(
      `Badge assignment process completed. Total badges assigned: ${results.totalAssigned}`
    );

    return results;
  } catch (error) {
    console.error("Error in badge assignment process:", error);
    return {
      success: false,
      message: "Badge assignment process failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// /**
//  * Assigns "Five Skill Sessions" badge to users who have completed exactly 5 sessions
//  */
export const assignFiveSkillSessionsBadge = async () => {
  try {
    console.log("Starting Five Skill Sessions badge assignment...");

    // Find users who have completed exactly 5 sessions
    const usersWithFiveSessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: "$user1Id",
          sessionCount: { $sum: 1 },
        },
      },
      {
        $unionWith: {
          coll: "sessions",
          pipeline: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: "$user2Id",
                sessionCount: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          totalSessions: { $sum: "$sessionCount" },
        },
      },
      {
        $match: { totalSessions: 5 },
      },
      {
        $group: {
          _id: null,
          userIds: { $addToSet: "$_id" },
        },
      },
    ]);

    if (!usersWithFiveSessions.length || !usersWithFiveSessions[0].userIds) {
      console.log("No users with exactly 5 completed sessions found");
      return {
        success: true,
        message: "No users with exactly 5 completed sessions found",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithFiveSessions[0].userIds;
    console.log(
      `Found ${eligibleUserIds.length} users with exactly 5 completed sessions`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(FIVE_SKILL_SESSIONS_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log(
        "All eligible users already have the Five Skill Sessions badge"
      );
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning Five Skill Sessions badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(FIVE_SKILL_SESSIONS_BADGE_ID),
        assignmentContext: "five_sessions_completed",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned Five Skill Sessions badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `Five Skill Sessions badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
    };
  } catch (error) {
    console.error("Error assigning Five Skill Sessions badge:", error);
    return {
      success: false,
      message: "Failed to assign Five Skill Sessions badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Assigns "Ten Skill Sessions" badge to users who have completed exactly 10 sessions
 */
export const assignTenSkillSessionsBadge = async () => {
  try {
    console.log("Starting Ten Skill Sessions badge assignment...");

    // Find users who have completed exactly 10 sessions
    const usersWithTenSessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: "$user1Id",
          sessionCount: { $sum: 1 },
        },
      },
      {
        $unionWith: {
          coll: "sessions",
          pipeline: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: "$user2Id",
                sessionCount: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          totalSessions: { $sum: "$sessionCount" },
        },
      },
      {
        $match: { totalSessions: 10 },
      },
      {
        $group: {
          _id: null,
          userIds: { $addToSet: "$_id" },
        },
      },
    ]);

    if (!usersWithTenSessions.length || !usersWithTenSessions[0].userIds) {
      console.log("No users with exactly 10 completed sessions found");
      return {
        success: true,
        message: "No users with exactly 10 completed sessions found",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithTenSessions[0].userIds;
    console.log(
      `Found ${eligibleUserIds.length} users with exactly 10 completed sessions`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(TEN_SKILL_SESSIONS_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log(
        "All eligible users already have the Ten Skill Sessions badge"
      );
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning Ten Skill Sessions badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(TEN_SKILL_SESSIONS_BADGE_ID),
        assignmentContext: "ten_sessions_completed",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned Ten Skill Sessions badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `Ten Skill Sessions badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
    };
  } catch (error) {
    console.error("Error assigning Ten Skill Sessions badge:", error);
    return {
      success: false,
      message: "Failed to assign Ten Skill Sessions badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Assigns "Twenty-Five Skill Sessions" badge to users who have completed exactly 25 sessions
 */
export const assignTwentyFiveSkillSessionsBadge = async () => {
  try {
    console.log("Starting Twenty-Five Skill Sessions badge assignment...");

    // Find users who have completed exactly 25 sessions
    const usersWithTwentyFiveSessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: "$user1Id",
          sessionCount: { $sum: 1 },
        },
      },
      {
        $unionWith: {
          coll: "sessions",
          pipeline: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: "$user2Id",
                sessionCount: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          totalSessions: { $sum: "$sessionCount" },
        },
      },
      {
        $match: { totalSessions: 25 },
      },
      {
        $group: {
          _id: null,
          userIds: { $addToSet: "$_id" },
        },
      },
    ]);

    if (
      !usersWithTwentyFiveSessions.length ||
      !usersWithTwentyFiveSessions[0].userIds
    ) {
      console.log("No users with exactly 25 completed sessions found");
      return {
        success: true,
        message: "No users with exactly 25 completed sessions found",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithTwentyFiveSessions[0].userIds;
    console.log(
      `Found ${eligibleUserIds.length} users with exactly 25 completed sessions`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(TWENTY_FIVE_SKILL_SESSIONS_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log(
        "All eligible users already have the Twenty-Five Skill Sessions badge"
      );
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning Twenty-Five Skill Sessions badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(
          TWENTY_FIVE_SKILL_SESSIONS_BADGE_ID
        ),
        assignmentContext: "twenty_five_sessions_completed",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned Twenty-Five Skill Sessions badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `Twenty-Five Skill Sessions badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
    };
  } catch (error) {
    console.error("Error assigning Twenty-Five Skill Sessions badge:", error);
    return {
      success: false,
      message: "Failed to assign Twenty-Five Skill Sessions badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Assigns "Fifty Skill Sessions" badge to users who have completed exactly 50 sessions
 */
export const assignFiftySkillSessionsBadge = async () => {
  try {
    console.log("Starting Fifty Skill Sessions badge assignment...");

    // Find users who have completed exactly 50 sessions
    const usersWithFiftySessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: "$user1Id",
          sessionCount: { $sum: 1 },
        },
      },
      {
        $unionWith: {
          coll: "sessions",
          pipeline: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: "$user2Id",
                sessionCount: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          totalSessions: { $sum: "$sessionCount" },
        },
      },
      {
        $match: { totalSessions: 50 },
      },
      {
        $group: {
          _id: null,
          userIds: { $addToSet: "$_id" },
        },
      },
    ]);

    if (!usersWithFiftySessions.length || !usersWithFiftySessions[0].userIds) {
      console.log("No users with exactly 50 completed sessions found");
      return {
        success: true,
        message: "No users with exactly 50 completed sessions found",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithFiftySessions[0].userIds;
    console.log(
      `Found ${eligibleUserIds.length} users with exactly 50 completed sessions`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(FIFTY_SKILL_SESSIONS_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log(
        "All eligible users already have the Fifty Skill Sessions badge"
      );
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning Fifty Skill Sessions badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(FIFTY_SKILL_SESSIONS_BADGE_ID),
        assignmentContext: "fifty_sessions_completed",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned Fifty Skill Sessions badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `Fifty Skill Sessions badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
    };
  } catch (error) {
    console.error("Error assigning Fifty Skill Sessions badge:", error);
    return {
      success: false,
      message: "Failed to assign Fifty Skill Sessions badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Assigns "One Hundred Skill Sessions" badge to users who have completed exactly 100 sessions
 */
export const assignOneHundredSkillSessionsBadge = async () => {
  try {
    console.log("Starting One Hundred Skill Sessions badge assignment...");

    // Find users who have completed exactly 100 sessions
    const usersWithOneHundredSessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: "$user1Id",
          sessionCount: { $sum: 1 },
        },
      },
      {
        $unionWith: {
          coll: "sessions",
          pipeline: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: "$user2Id",
                sessionCount: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          totalSessions: { $sum: "$sessionCount" },
        },
      },
      {
        $match: { totalSessions: 100 },
      },
      {
        $group: {
          _id: null,
          userIds: { $addToSet: "$_id" },
        },
      },
    ]);

    if (
      !usersWithOneHundredSessions.length ||
      !usersWithOneHundredSessions[0].userIds
    ) {
      console.log("No users with exactly 100 completed sessions found");
      return {
        success: true,
        message: "No users with exactly 100 completed sessions found",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithOneHundredSessions[0].userIds;
    console.log(
      `Found ${eligibleUserIds.length} users with exactly 100 completed sessions`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(ONE_HUNDRED_SKILL_SESSIONS_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log(
        "All eligible users already have the One Hundred Skill Sessions badge"
      );
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning One Hundred Skill Sessions badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(
          ONE_HUNDRED_SKILL_SESSIONS_BADGE_ID
        ),
        assignmentContext: "one_hundred_sessions_completed",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned One Hundred Skill Sessions badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `One Hundred Skill Sessions badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
    };
  } catch (error) {
    console.error("Error assigning One Hundred Skill Sessions badge:", error);
    return {
      success: false,
      message: "Failed to assign One Hundred Skill Sessions badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Assigns "Coding Ninja" badge to users who have completed sessions offering coding skills
 */
export const assignCodingNinjaBadge = async () => {
  try {
    console.log("Starting Coding Ninja badge assignment...");

    // Find completed sessions where a user offered a coding skill (categoryId: 1)
    const usersWithCodingSessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      // Lookup skill1 details for user1 (the skill user1 is offering)
      {
        $lookup: {
          from: "userskills",
          localField: "skill1Id",
          foreignField: "_id",
          as: "skill1Details",
        },
      },
      // Lookup skill2 details for user2 (the skill user2 is offering)
      {
        $lookup: {
          from: "userskills",
          localField: "skill2Id",
          foreignField: "_id",
          as: "skill2Details",
        },
      },
      // Unwind the skill details arrays
      {
        $unwind: {
          path: "$skill1Details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$skill2Details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Find users who offered coding skills (categoryId: 1)
      {
        $match: {
          $or: [
            { "skill1Details.categoryId": 1 }, // user1 offered coding skill
            { "skill2Details.categoryId": 1 }, // user2 offered coding skill
          ],
        },
      },
      // Project to get the user IDs who offered coding skills
      {
        $project: {
          codingUsers: {
            $cond: {
              if: { $eq: ["$skill1Details.categoryId", 1] },
              then: ["$user1Id"],
              else: [],
            },
          },
          codingUsers2: {
            $cond: {
              if: { $eq: ["$skill2Details.categoryId", 1] },
              then: ["$user2Id"],
              else: [],
            },
          },
        },
      },
      // Combine both arrays
      {
        $project: {
          allCodingUsers: { $concatArrays: ["$codingUsers", "$codingUsers2"] },
        },
      },
      // Unwind to get individual user IDs
      {
        $unwind: "$allCodingUsers",
      },
      // Group to get unique user IDs
      {
        $group: {
          _id: null,
          userIds: { $addToSet: "$allCodingUsers" },
        },
      },
    ]);

    if (
      !usersWithCodingSessions.length ||
      !usersWithCodingSessions[0].userIds
    ) {
      console.log(
        "No users found who completed sessions offering coding skills"
      );
      return {
        success: true,
        message: "No users found who completed sessions offering coding skills",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithCodingSessions[0].userIds;
    console.log(
      `Found ${eligibleUserIds.length} users who completed sessions offering coding skills`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(CODING_NINJA_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log("All eligible users already have the Coding Ninja badge");
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning Coding Ninja badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(CODING_NINJA_BADGE_ID),
        assignmentContext: "coding_skill_session_completed",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned Coding Ninja badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `Coding Ninja badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
    };
  } catch (error) {
    console.error("Error assigning Coding Ninja badge:", error);
    return {
      success: false,
      message: "Failed to assign Coding Ninja badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Assigns "Art Virtuoso" badge to users who have completed sessions offering Creative Arts & Entertainment skills
 * NOTE: Assuming categoryId 2 for "Creative Arts & Entertainment" based on typical ordering (Coding & Programming is 1)
 */
export const assignArtVirtuosoBadge = async () => {
  try {
    console.log("Starting Art Virtuoso badge assignment...");

    // Find completed sessions where a user offered a Creative Arts & Entertainment skill (categoryId: 2)
    const usersWithArtsSessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      // Lookup skill1 details for user1 (the skill user1 is offering)
      {
        $lookup: {
          from: "userskills",
          localField: "skill1Id",
          foreignField: "_id",
          as: "skill1Details",
        },
      },
      // Lookup skill2 details for user2 (the skill user2 is offering)
      {
        $lookup: {
          from: "userskills",
          localField: "skill2Id",
          foreignField: "_id",
          as: "skill2Details",
        },
      },
      // Unwind the skill details arrays
      {
        $unwind: {
          path: "$skill1Details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$skill2Details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Find users who offered Creative Arts & Entertainment skills (categoryId: 2)
      {
        $match: {
          $or: [
            { "skill1Details.categoryId": 2 }, // user1 offered Creative Arts skill
            { "skill2Details.categoryId": 2 }, // user2 offered Creative Arts skill
          ],
        },
      },
      // Project to get the user IDs who offered Creative Arts skills
      {
        $project: {
          artsUsers: {
            $cond: {
              if: { $eq: ["$skill1Details.categoryId", 2] },
              then: ["$user1Id"],
              else: [],
            },
          },
          artsUsers2: {
            $cond: {
              if: { $eq: ["$skill2Details.categoryId", 2] },
              then: ["$user2Id"],
              else: [],
            },
          },
        },
      },
      // Combine both arrays
      {
        $project: {
          allArtsUsers: { $concatArrays: ["$artsUsers", "$artsUsers2"] },
        },
      },
      // Unwind to get individual user IDs
      {
        $unwind: "$allArtsUsers",
      },
      // Group to get unique user IDs
      {
        $group: {
          _id: null,
          userIds: { $addToSet: "$allArtsUsers" },
        },
      },
    ]);

    if (!usersWithArtsSessions.length || !usersWithArtsSessions[0].userIds) {
      console.log(
        "No users found who completed sessions offering Creative Arts & Entertainment skills"
      );
      return {
        success: true,
        message:
          "No users found who completed sessions offering Creative Arts & Entertainment skills",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithArtsSessions[0].userIds;
    console.log(
      `Found ${eligibleUserIds.length} users who completed sessions offering Creative Arts & Entertainment skills`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(ART_VIRTUOSO_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log("All eligible users already have the Art Virtuoso badge");
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning Art Virtuoso badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(ART_VIRTUOSO_BADGE_ID),
        assignmentContext: "creative_arts_skill_session_completed",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned Art Virtuoso badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `Art Virtuoso badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
    };
  } catch (error) {
    console.error("Error assigning Art Virtuoso badge:", error);
    return {
      success: false,
      message: "Failed to assign Art Virtuoso badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Assigns "Trailblazer" badge to the first 100 users who completed at least one session
 * These are the early adopters who helped establish the platform
 */
export const assignTrailblazerBadge = async () => {
  try {
    console.log("Starting Trailblazer badge assignment...");

    // Find the first 100 users who completed at least one session, ordered by their first session completion date
    const usersWithFirstSessions = await Session.aggregate([
      {
        $match: { status: "completed" },
      },
      // Get all user sessions
      {
        $group: {
          _id: "$user1Id",
          firstSessionDate: { $min: "$updatedAt" },
        },
      },
      {
        $unionWith: {
          coll: "sessions",
          pipeline: [
            { $match: { status: "completed" } },
            {
              $group: {
                _id: "$user2Id",
                firstSessionDate: { $min: "$updatedAt" },
              },
            },
          ],
        },
      },
      // Group again to get the earliest session date for each user
      {
        $group: {
          _id: "$_id",
          firstSessionDate: { $min: "$firstSessionDate" },
        },
      },
      // Sort by first session date (earliest first)
      {
        $sort: { firstSessionDate: 1 },
      },
      // Take only the first 100 users
      {
        $limit: 100,
      },
      // Group to collect all user IDs
      {
        $group: {
          _id: null,
          userIds: { $push: "$_id" },
          users: {
            $push: { userId: "$_id", firstSessionDate: "$firstSessionDate" },
          },
        },
      },
    ]);

    if (!usersWithFirstSessions.length || !usersWithFirstSessions[0].userIds) {
      console.log("No users found who completed sessions");
      return {
        success: true,
        message: "No users found who completed sessions",
        assignedCount: 0,
      };
    }

    const eligibleUserIds = usersWithFirstSessions[0].userIds;
    console.log(
      `Found ${eligibleUserIds.length} users eligible for Trailblazer badge (first ${eligibleUserIds.length} users who completed sessions)`
    );

    // Check which users already have this badge
    const existingAssignments = await BadgeAssignment.find({
      userId: { $in: eligibleUserIds },
      badgeId: new mongoose.Types.ObjectId(TRAILBLAZER_BADGE_ID),
    }).select("userId");

    const usersWithBadge = existingAssignments.map((assignment) =>
      assignment.userId.toString()
    );

    // Filter out users who already have the badge
    const usersToAssignBadge = eligibleUserIds.filter(
      (userId: mongoose.Types.ObjectId) =>
        !usersWithBadge.includes(userId.toString())
    );

    if (usersToAssignBadge.length === 0) {
      console.log("All eligible users already have the Trailblazer badge");
      return {
        success: true,
        message: "All eligible users already have the badge",
        assignedCount: 0,
      };
    }

    console.log(
      `Assigning Trailblazer badge to ${usersToAssignBadge.length} users`
    );

    // Create badge assignments
    const badgeAssignments = usersToAssignBadge.map(
      (userId: mongoose.Types.ObjectId) => ({
        userId: new mongoose.Types.ObjectId(userId),
        badgeId: new mongoose.Types.ObjectId(TRAILBLAZER_BADGE_ID),
        assignmentContext: "trailblazer_early_adopter",
        assignedAt: new Date(),
      })
    );

    // Bulk insert badge assignments
    const assignmentResults = await BadgeAssignment.insertMany(
      badgeAssignments,
      { ordered: false }
    );

    console.log(
      `Successfully assigned Trailblazer badge to ${assignmentResults.length} users`
    );

    return {
      success: true,
      message: `Trailblazer badge assigned to ${assignmentResults.length} users`,
      assignedCount: assignmentResults.length,
      assignedUsers: usersToAssignBadge,
      eligibleUsers: usersWithFirstSessions[0].users, // Include details for debugging
    };
  } catch (error) {
    console.error("Error assigning Trailblazer badge:", error);
    return {
      success: false,
      message: "Failed to assign Trailblazer badge",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
