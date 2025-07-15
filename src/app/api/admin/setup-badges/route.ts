import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Badge from "@/lib/models/badgeSchema";
import User from "@/lib/models/userSchema";

/**
 * Setup API endpoint to initialize badge system
 * POST /api/admin/setup-badges
 */
export async function POST(req: NextRequest) {
  try {
    console.log("🎯 Starting badge system setup via API...");

    await dbConnect();

    // Step 1: Add badges field to users who don't have it
    console.log("📝 Step 1: Migrating users...");
    const userMigrationResult = await User.updateMany(
      { badges: { $exists: false } },
      { $set: { badges: [] } }
    );

    const nullBadgesMigration = await User.updateMany(
      { badges: null },
      { $set: { badges: [] } }
    );

    console.log(
      `✅ Updated ${userMigrationResult.modifiedCount + nullBadgesMigration.modifiedCount} users`
    );

    // Step 2: Create default badges
    console.log("🏆 Step 2: Creating badges...");
    const defaultBadges = [
      {
        badgeName: "First Exchange",
        description:
          "Awarded for completing your very first skill exchange on the platform",
        badgeImage: "/badges/first-exchange.png",
        criteria: "Complete your first skill exchange session",
      },
      {
        badgeName: "Quick Learner",
        description: "Awarded for actively participating in skill exchanges",
        badgeImage: "/badges/quick-learner.png",
        criteria: "Complete 5 skill exchange sessions",
      },
      {
        badgeName: "Skill Master",
        description:
          "Awarded for becoming highly experienced in skill exchanges",
        badgeImage: "/badges/skill-master.png",
        criteria: "Complete 10 skill exchange sessions",
      },
      {
        badgeName: "Community Champion",
        description:
          "Awarded for outstanding contribution to the skill-swapping community",
        badgeImage: "/badges/community-champion.png",
        criteria: "Complete 25 skill exchange sessions",
      },
    ];

    const createdBadges = [];
    const existingBadges = [];
    for (const badgeData of defaultBadges) {
      const existingBadge = await Badge.findOne({
        badgeName: badgeData.badgeName,
      });

      if (!existingBadge) {
        const newBadge = await Badge.create(badgeData);
        createdBadges.push(newBadge.badgeName);
      } else {
        existingBadges.push(existingBadge.badgeName);
      }
    }

    // Step 3: Verify setup
    const totalUsers = await User.countDocuments();
    const usersWithBadges = await User.countDocuments({
      badges: { $exists: true, $ne: null },
    });
    const totalBadges = await Badge.countDocuments();
    const allBadges = await Badge.find({}, "badgeName description");

    return NextResponse.json({
      success: true,
      message: "Badge system setup completed successfully!",
      data: {
        migration: {
          totalUsers,
          usersWithBadgesField: usersWithBadges,
          usersUpdated:
            userMigrationResult.modifiedCount +
            nullBadgesMigration.modifiedCount,
        },
        badges: {
          total: totalBadges,
          created: createdBadges,
          existing: existingBadges,
          allBadges: allBadges.map((b) => ({
            badgeName: b.badgeName,
            description: b.description,
          })),
        },
      },
    });
  } catch (error) {
    console.error("❌ Badge setup failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Badge system setup failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check badge system status
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const totalUsers = await User.countDocuments();
    const usersWithBadges = await User.countDocuments({
      badges: { $exists: true, $ne: null },
    });
    const totalBadges = await Badge.countDocuments();
    const allBadges = await Badge.find({}, "badgeName description");

    // Sample user with badges for testing
    const sampleUserWithBadges = await User.findOne({
      badges: { $exists: true, $ne: [] },
    })
      .populate("badges", "badgeName description")
      .select("firstName lastName badges");

    return NextResponse.json({
      success: true,
      data: {
        system: {
          totalUsers,
          usersWithBadgesField: usersWithBadges,
          totalBadges,
          systemReady: totalBadges > 0 && usersWithBadges === totalUsers,
        },
        badges: allBadges.map((b) => ({
          badgeName: b.badgeName,
          description: b.description,
        })),
        sampleUser: sampleUserWithBadges
          ? {
              name: `${sampleUserWithBadges.firstName} ${sampleUserWithBadges.lastName}`,
              badgeCount: sampleUserWithBadges.badges?.length || 0,
              badges: sampleUserWithBadges.badges,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("❌ Failed to get badge system status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get badge system status",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
