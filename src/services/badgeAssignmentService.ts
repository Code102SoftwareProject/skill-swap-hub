import connect from "@/lib/db";
import User from "@/lib/models/userSchema";
import Badge from "@/lib/models/badgeSchema";
import Session from "@/lib/models/sessionSchema";
import UserSkill from "@/lib/models/userSkill";
import mongoose from "mongoose";

/**
 * Assigns a badge to a user if they don't already have it
 * @param userId - The ID of the user to assign the badge to
 * @param badgeName - The name of the badge to assign
 * @returns Promise<boolean> - true if badge was assigned, false if already had it or error occurred
 */
export async function assignBadgeToUser(
  userId: string,
  badgeName: string
): Promise<boolean> {
  try {
    await connect();

    // Find the badge by name
    const badge = await Badge.findOne({ badgeName });
    if (!badge) {
      console.error(`Badge "${badgeName}" not found`);
      return false;
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User with ID "${userId}" not found`);
      return false;
    }

    // Check if user already has this badge
    if (user.badges && user.badges.includes(badge._id)) {
      console.log(`User ${userId} already has badge "${badgeName}"`);
      return false;
    }

    // Add badge to user's badges array
    if (!user.badges) {
      user.badges = [];
    }
    user.badges.push(badge._id);
    await user.save();

    console.log(`Badge "${badgeName}" assigned to user ${userId}`);
    return true;
  } catch (error) {
    console.error(
      `Error assigning badge "${badgeName}" to user ${userId}:`,
      error
    );
    return false;
  }
}

/**
 * Counts the number of completed skill sessions for a user
 * @param userId - The ID of the user
 * @returns Promise<number> - The count of completed sessions
 */
export async function getCompletedSkillSessionsCount(
  userId: string
): Promise<number> {
  try {
    await connect();

    // Import SkillMatch model for checking completed matches
    const { default: SkillMatch } = await import("@/lib/models/skillMatch");

    // Count matches where the user is either userOneId or userTwoId and status is completed
    const completedMatches = await SkillMatch.countDocuments({
      $and: [
        {
          $or: [{ userOneId: userId }, { userTwoId: userId }],
        },
        { status: "completed" },
      ],
    });

    return completedMatches;
  } catch (error) {
    console.error(
      `Error counting completed sessions for user ${userId}:`,
      error
    );
    return 0;
  }
}

/**
 * Checks if a user has a specific badge
 * @param userId - The ID of the user
 * @param badgeName - The name of the badge to check
 * @returns Promise<boolean> - true if user has the badge, false otherwise
 */
export async function userHasBadge(
  userId: string,
  badgeName: string
): Promise<boolean> {
  try {
    await connect();

    // Find the badge by name
    const badge = await Badge.findOne({ badgeName });
    if (!badge) {
      return false;
    }

    // Find the user and check if they have this badge
    const user = await User.findById(userId);
    if (!user || !user.badges) {
      return false;
    }

    return user.badges.includes(badge._id);
  } catch (error) {
    console.error(
      `Error checking if user ${userId} has badge "${badgeName}":`,
      error
    );
    return false;
  }
}

/**
 * The main function to check and assign the "First Exchange" badge
 * @param userId - The ID of the user to check
 * @returns Promise<boolean> - true if badge was assigned, false otherwise
 */
export async function checkAndAssignFirstExchangeBadge(
  userId: string
): Promise<boolean> {
  try {
    console.log(`Checking First Exchange badge eligibility for user ${userId}`);

    // Check if user has completed exactly one skill session
    const completedSessions = await getCompletedSkillSessionsCount(userId);
    console.log(`User ${userId} has ${completedSessions} completed sessions`);

    if (completedSessions !== 1) {
      console.log(
        `User ${userId} does not qualify for First Exchange badge (sessions: ${completedSessions})`
      );
      return false;
    }

    // Check if user already has the "First Exchange" badge
    const hasFirstExchangeBadge = await userHasBadge(userId, "First Exchange");
    if (hasFirstExchangeBadge) {
      console.log(`User ${userId} already has the First Exchange badge`);
      return false;
    }

    // Assign the badge
    const badgeAssigned = await assignBadgeToUser(userId, "First Exchange");
    if (badgeAssigned) {
      console.log(
        `Successfully assigned First Exchange badge to user ${userId}`
      );
    }

    return badgeAssigned;
  } catch (error) {
    console.error(
      `Error in checkAndAssignFirstExchangeBadge for user ${userId}:`,
      error
    );
    return false;
  }
}

/**
 * Check and assign the "Skill Master" badge (for users with 10+ verified skills)
 * @param userId - The ID of the user to check
 * @returns Promise<boolean> - true if badge was assigned, false otherwise
 */
export async function checkAndAssignSkillMasterBadge(
  userId: string
): Promise<boolean> {
  try {
    console.log(`Checking Skill Master badge eligibility for user ${userId}`);

    // Count verified skills for the user
    const verifiedSkillsCount = await UserSkill.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isVerified: true,
    });

    if (verifiedSkillsCount < 10) {
      console.log(
        `User ${userId} does not qualify for Skill Master badge (verified skills: ${verifiedSkillsCount})`
      );
      return false;
    }

    // Check if user already has the badge
    const hasSkillMasterBadge = await userHasBadge(userId, "Skill Master");
    if (hasSkillMasterBadge) {
      console.log(`User ${userId} already has the Skill Master badge`);
      return false;
    }

    // Assign the badge
    const success = await assignBadgeToUser(userId, "Skill Master");
    if (success) {
      console.log(`Successfully assigned Skill Master badge to user ${userId}`);
    }

    return success;
  } catch (error) {
    console.error(
      `Error checking Skill Master badge for user ${userId}:`,
      error
    );
    return false;
  }
}

/**
 * Check and assign the "Community Helper" badge (for users with 5+ forum posts)
 * @param userId - The ID of the user to check
 * @returns Promise<boolean> - true if badge was assigned, false otherwise
 */
export async function checkAndAssignCommunityHelperBadge(
  userId: string
): Promise<boolean> {
  try {
    console.log(
      `Checking Community Helper badge eligibility for user ${userId}`
    );

    // Count forum posts by the user (you'd need to adjust this based on your forum post model)
    // const forumPostsCount = await ForumPost.countDocuments({
    //   authorId: new mongoose.Types.ObjectId(userId)
    // });

    // For now, using a placeholder - replace with actual forum post counting
    const forumPostsCount = 0; // Replace with actual forum post count logic

    if (forumPostsCount < 5) {
      console.log(
        `User ${userId} does not qualify for Community Helper badge (forum posts: ${forumPostsCount})`
      );
      return false;
    }

    // Check if user already has the badge
    const hasCommunityHelperBadge = await userHasBadge(
      userId,
      "Community Helper"
    );
    if (hasCommunityHelperBadge) {
      console.log(`User ${userId} already has the Community Helper badge`);
      return false;
    }

    // Assign the badge
    const success = await assignBadgeToUser(userId, "Community Helper");
    if (success) {
      console.log(
        `Successfully assigned Community Helper badge to user ${userId}`
      );
    }

    return success;
  } catch (error) {
    console.error(
      `Error checking Community Helper badge for user ${userId}:`,
      error
    );
    return false;
  }
}

/**
 * Check and assign the "Mentor" badge (for users who completed 5+ sessions as skill providers)
 * @param userId - The ID of the user to check
 * @returns Promise<boolean> - true if badge was assigned, false otherwise
 */
export async function checkAndAssignMentorBadge(
  userId: string
): Promise<boolean> {
  try {
    console.log(`Checking Mentor badge eligibility for user ${userId}`);

    // Count completed sessions where user was the skill provider
    const mentorSessionsCount = await getCompletedMentorSessionsCount(userId);

    if (mentorSessionsCount < 5) {
      console.log(
        `User ${userId} does not qualify for Mentor badge (mentor sessions: ${mentorSessionsCount})`
      );
      return false;
    }

    // Check if user already has the badge
    const hasMentorBadge = await userHasBadge(userId, "Mentor");
    if (hasMentorBadge) {
      console.log(`User ${userId} already has the Mentor badge`);
      return false;
    }

    // Assign the badge
    const success = await assignBadgeToUser(userId, "Mentor");
    if (success) {
      console.log(`Successfully assigned Mentor badge to user ${userId}`);
    }

    return success;
  } catch (error) {
    console.error(`Error checking Mentor badge for user ${userId}:`, error);
    return false;
  }
}

/**
 * Helper function to count completed sessions where user was the mentor/skill provider
 * @param userId - The ID of the user
 * @returns Promise<number> - The count of completed mentor sessions
 */
async function getCompletedMentorSessionsCount(
  userId: string
): Promise<number> {
  try {
    await connect();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // This would need to be adjusted based on how you track who is the mentor in sessions
    // For now, assuming user1 is always the mentor - adjust based on your actual data structure
    const mentorSessions = await Session.countDocuments({
      user1Id: userObjectId,
      status: "completed",
    });

    return mentorSessions;
  } catch (error) {
    console.error(`Error counting mentor sessions for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Check and assign multiple badges for a user
 * @param userId - The ID of the user to check
 * @returns Promise<string[]> - Array of badge names that were assigned
 */
export async function checkAndAssignAllBadges(
  userId: string
): Promise<string[]> {
  const assignedBadges: string[] = [];

  try {
    // Check all badge types
    const badgeChecks = [
      { check: checkAndAssignFirstExchangeBadge, name: "First Exchange" },
      { check: checkAndAssignSkillMasterBadge, name: "Skill Master" },
      { check: checkAndAssignCommunityHelperBadge, name: "Community Helper" },
      { check: checkAndAssignMentorBadge, name: "Mentor" },
    ];

    for (const { check, name } of badgeChecks) {
      try {
        const assigned = await check(userId);
        if (assigned) {
          assignedBadges.push(name);
        }
      } catch (error) {
        console.error(
          `Error checking ${name} badge for user ${userId}:`,
          error
        );
      }
    }

    if (assignedBadges.length > 0) {
      console.log(`Assigned badges to user ${userId}:`, assignedBadges);
    }

    return assignedBadges;
  } catch (error) {
    console.error(
      `Error in checkAndAssignAllBadges for user ${userId}:`,
      error
    );
    return assignedBadges;
  }
}

/**
 * Handles badge assignments specifically for match completion events
 * This function centralizes all badge logic related to completing a skill exchange match
 * @param userOneId - The ID of the first user in the completed match
 * @param userTwoId - The ID of the second user in the completed match
 * @param matchId - The ID of the completed match (for logging purposes)
 * @returns Promise<{ userOneAssigned: string[], userTwoAssigned: string[] }> - Arrays of badge names assigned to each user
 */
export async function handleMatchCompletionBadges(
  userOneId: string,
  userTwoId: string,
  matchId: string
): Promise<{ userOneAssigned: string[]; userTwoAssigned: string[] }> {
  console.log(`Processing badge assignments for match completion: ${matchId}`);

  try {
    await connect();

    // Run badge checks for both users in parallel
    const [userOneResults, userTwoResults] = await Promise.allSettled([
      checkAndAssignFirstExchangeBadge(userOneId),
      checkAndAssignFirstExchangeBadge(userTwoId),
      // Add more badge checks here as needed:
      // checkAndAssignSkillMasterBadge(userOneId),
      // checkAndAssignSkillMasterBadge(userTwoId),
      // checkAndAssignCommunityHelperBadge(userOneId),
      // checkAndAssignCommunityHelperBadge(userTwoId),
    ]);

    const userOneAssigned: string[] = [];
    const userTwoAssigned: string[] = [];

    // Process results for user one
    if (userOneResults.status === "fulfilled" && userOneResults.value) {
      userOneAssigned.push("First Exchange");
    } else if (userOneResults.status === "rejected") {
      console.error(
        `Badge assignment failed for user ${userOneId}:`,
        userOneResults.reason
      );
    }

    // Process results for user two
    if (userTwoResults.status === "fulfilled" && userTwoResults.value) {
      userTwoAssigned.push("First Exchange");
    } else if (userTwoResults.status === "rejected") {
      console.error(
        `Badge assignment failed for user ${userTwoId}:`,
        userTwoResults.reason
      );
    }

    const result = { userOneAssigned, userTwoAssigned };

    if (userOneAssigned.length > 0 || userTwoAssigned.length > 0) {
      console.log(`Match completion badge assignments for ${matchId}:`, result);
    } else {
      console.log(
        `No badges assigned for match completion ${matchId} - users may already have badges or don't meet criteria`
      );
    }

    return result;
  } catch (error) {
    console.error(
      `Error in handleMatchCompletionBadges for match ${matchId}:`,
      error
    );
    throw error;
  }
}
