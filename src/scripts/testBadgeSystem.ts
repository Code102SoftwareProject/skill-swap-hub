// Test script to verify badge assignment functionality
import dbConnect from "../lib/db";
import User from "../lib/models/userSchema";
import Badge from "../lib/models/badgeSchema";
import {
  checkAndAssignFirstExchangeBadge,
  checkAndAssignAllBadges,
  assignBadgeToUser,
  userHasBadge,
} from "../services/badgeAssignmentService";

async function testBadgeSystem() {
  try {
    await dbConnect();
    console.log("🔌 Connected to database");

    // 1. Check if badges exist
    console.log("\n📋 Checking available badges...");
    const badges = await Badge.find({});
    console.log(`Found ${badges.length} badges:`);
    badges.forEach((badge) => {
      console.log(`   - ${badge.name}: ${badge.description}`);
    });

    if (badges.length === 0) {
      console.log(
        "⚠️  No badges found! Please run the badge creation scripts first."
      );
      return;
    }

    // 2. Find a test user
    console.log("\n👤 Finding test user...");
    const testUser = await User.findOne({}).limit(1);

    if (!testUser) {
      console.log("❌ No users found in database!");
      return;
    }

    console.log(
      `Using test user: ${testUser.firstName} ${testUser.lastName} (${testUser._id})`
    );

    // 3. Check current badges
    console.log("\n🏆 Current user badges...");
    const userWithBadges = await User.findById(testUser._id).populate("badges");
    console.log(
      `User currently has ${userWithBadges?.badges?.length || 0} badges:`
    );
    if (userWithBadges?.badges?.length) {
      (userWithBadges.badges as any[]).forEach((badge: any) => {
        console.log(`   - ${badge.name}`);
      });
    }

    // 4. Test manual badge assignment
    console.log("\n🎯 Testing manual badge assignment...");
    const firstExchangeBadge = badges.find((b) => b.name === "First Exchange");
    if (firstExchangeBadge) {
      const hasFirstExchange = await userHasBadge(
        testUser._id.toString(),
        "First Exchange"
      );
      console.log(`User has First Exchange badge: ${hasFirstExchange}`);

      if (!hasFirstExchange) {
        console.log("Manually assigning First Exchange badge...");
        const assigned = await assignBadgeToUser(
          testUser._id.toString(),
          "First Exchange"
        );
        console.log(`Assignment result: ${assigned}`);
      }
    }

    // 5. Test First Exchange badge logic
    console.log("\n🔄 Testing First Exchange badge logic...");
    const firstExchangeResult = await checkAndAssignFirstExchangeBadge(
      testUser._id.toString()
    );
    console.log(`First Exchange badge check result: ${firstExchangeResult}`);

    // 6. Test all badges check
    console.log("\n🌟 Testing all badges check...");
    const allBadgesResult = await checkAndAssignAllBadges(
      testUser._id.toString()
    );
    console.log(`All badges check result:`, allBadgesResult);

    // 7. Final badge count
    console.log("\n📊 Final badge status...");
    const finalUser = await User.findById(testUser._id).populate("badges");
    console.log(`User now has ${finalUser?.badges?.length || 0} badges:`);
    if (finalUser?.badges?.length) {
      (finalUser.badges as any[]).forEach((badge: any) => {
        console.log(`   - ${badge.name}: ${badge.description}`);
      });
    }

    console.log("\n✅ Badge system test completed successfully!");
  } catch (error) {
    console.error("❌ Error in badge system test:", error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testBadgeSystem();
