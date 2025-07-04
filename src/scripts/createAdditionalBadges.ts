// Script to create additional badge types in the database
import dbConnect from "../lib/db";
import Badge from "../lib/models/badgeSchema";

async function createAdditionalBadges() {
  try {
    await dbConnect();
    console.log("Connected to database");

    const badges = [
      {
        name: "Skill Master",
        description: "Awarded to users who have 10+ verified skills",
        imageUrl: "/badges/skill-master.png",
        criteria: "Have 10 or more verified skills",
        isActive: true,
      },
      {
        name: "Community Helper",
        description:
          "Awarded to users who actively participate in community forums",
        imageUrl: "/badges/community-helper.png",
        criteria: "Make 5 or more helpful forum posts",
        isActive: true,
      },
      {
        name: "Mentor",
        description:
          "Awarded to users who have completed 5+ sessions as skill providers",
        imageUrl: "/badges/mentor.png",
        criteria: "Complete 5 or more sessions as a skill provider/mentor",
        isActive: true,
      },
      {
        name: "Learning Enthusiast",
        description:
          "Awarded to users who have completed 10+ sessions as skill learners",
        imageUrl: "/badges/learning-enthusiast.png",
        criteria: "Complete 10 or more sessions as a skill learner",
        isActive: true,
      },
      {
        name: "Verified Professional",
        description: "Awarded to users who have completed profile verification",
        imageUrl: "/badges/verified-professional.png",
        criteria: "Complete profile verification process",
        isActive: true,
      },
    ];

    for (const badgeData of badges) {
      try {
        // Check if badge already exists
        const existingBadge = await Badge.findOne({ name: badgeData.name });

        if (existingBadge) {
          console.log(`Badge "${badgeData.name}" already exists, skipping...`);
          continue;
        }

        // Create new badge
        const badge = new Badge(badgeData);
        await badge.save();
        console.log(`✅ Created badge: "${badgeData.name}"`);
      } catch (error) {
        console.error(`❌ Error creating badge "${badgeData.name}":`, error);
      }
    }

    console.log("\n🎉 Badge creation process completed!");

    // List all badges
    const allBadges = await Badge.find({});
    console.log(`\n📊 Total badges in database: ${allBadges.length}`);
    allBadges.forEach((badge) => {
      console.log(`   - ${badge.name}: ${badge.description}`);
    });
  } catch (error) {
    console.error("❌ Error in badge creation script:", error);
  } finally {
    process.exit(0);
  }
}

// Run the script
createAdditionalBadges();
