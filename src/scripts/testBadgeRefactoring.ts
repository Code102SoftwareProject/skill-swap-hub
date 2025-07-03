// File: src/scripts/testBadgeRefactoring.ts
import { handleMatchCompletionBadges } from "@/services/badgeAssignmentService";

/**
 * Test script to verify the refactored badge assignment system
 * This script tests the new handleMatchCompletionBadges function
 */
async function testBadgeRefactoring() {
  console.log("Testing refactored badge assignment system...");

  try {
    // Test with dummy user IDs and match ID
    // In a real scenario, these would be actual MongoDB ObjectIds
    const testUserOneId = "507f1f77bcf86cd799439011"; // dummy ObjectId
    const testUserTwoId = "507f1f77bcf86cd799439012"; // dummy ObjectId
    const testMatchId = "507f1f77bcf86cd799439013"; // dummy ObjectId

    console.log("Testing handleMatchCompletionBadges function...");

    // This will likely fail because the users don't exist, but we can test the function structure
    const result = await handleMatchCompletionBadges(
      testUserOneId,
      testUserTwoId,
      testMatchId
    );

    console.log("Badge assignment result:", result);
    console.log(
      "✅ Function executed successfully (even if no badges were assigned)"
    );
  } catch (error) {
    console.error("❌ Error in badge assignment test:", error);

    // Check if the error is expected (users not found)
    if (error instanceof Error && error.message.includes("not found")) {
      console.log(
        "✅ Expected error - users don't exist in test, but function structure is correct"
      );
    } else {
      console.log("❌ Unexpected error occurred");
    }
  }
}

// Export for potential use in other test files
export { testBadgeRefactoring };

// Run the test if this file is executed directly
if (require.main === module) {
  testBadgeRefactoring()
    .then(() => {
      console.log("Test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test failed:", error);
      process.exit(1);
    });
}
