import addBadgesToExistingUsers from "./migrations/addBadgesToUsers";
import dbConnect from "../lib/db";
import Badge from "../lib/models/badgeSchema";

/**
 * Complete setup script for the badge system
 * 1. Runs user migration
 * 2. Creates default badges
 * 3. Verifies the setup
 */
async function setupBadgeSystem() {
  try {
    console.log("🎯 Starting complete badge system setup...\n");

    // Step 1: Run user migration
    console.log("📝 Step 1: Running user migration...");
    await addBadgesToExistingUsers();
    console.log("✅ User migration completed\n");

    // Step 2: Create default badges
    console.log("🏆 Step 2: Creating default badges...");
    await dbConnect();

    const defaultBadges = [
      {
        name: "First Exchange",
        description:
          "Awarded for completing your very first skill exchange on the platform",
        imageUrl: "/badges/first-exchange.png",
        criteria: "Complete your first skill exchange session",
        isActive: true,
      },
      {
        name: "Quick Learner",
        description: "Awarded for actively participating in skill exchanges",
        imageUrl: "/badges/quick-learner.png",
        criteria: "Complete 5 skill exchange sessions",
        isActive: true,
      },
      {
        name: "Skill Master",
        description:
          "Awarded for becoming highly experienced in skill exchanges",
        imageUrl: "/badges/skill-master.png",
        criteria: "Complete 10 skill exchange sessions",
        isActive: true,
      },
      {
        name: "Community Champion",
        description:
          "Awarded for outstanding contribution to the skill-swapping community",
        imageUrl: "/badges/community-champion.png",
        criteria: "Complete 25 skill exchange sessions",
        isActive: true,
      },
    ];

    for (const badgeData of defaultBadges) {
      try {
        const existingBadge = await Badge.findOne({ name: badgeData.name });

        if (!existingBadge) {
          await Badge.create(badgeData);
          console.log(`   ✅ Created badge: ${badgeData.name}`);
        } else {
          console.log(`   ⏭️  Badge already exists: ${badgeData.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to create badge: ${badgeData.name}`, error);
      }
    }

    // Step 3: Verify setup
    console.log("\n🔍 Step 3: Verifying setup...");
    const totalBadges = await Badge.countDocuments();
    console.log(`   📊 Total badges in system: ${totalBadges}`);

    const allBadges = await Badge.find({});
    console.log("   📋 Available badges:");
    allBadges.forEach((badge) => {
      console.log(`      - ${badge.name}: ${badge.description}`);
    });

    console.log("\n🎉 Badge system setup completed successfully!");
  } catch (error) {
    console.error("💥 Badge system setup failed:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  setupBadgeSystem()
    .then(() => {
      console.log("✅ Setup script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup script failed:", error);
      process.exit(1);
    });
}

export default setupBadgeSystem;
