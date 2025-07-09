// Quick debug script to check badge assignment logic
// Run this to see what's happening with badge assignment

const testUserBadgeLogic = async () => {
  console.log("=== BADGE ASSIGNMENT DEBUG ===");

  // Test the API endpoint that might be auto-assigning badges
  try {
    const response = await fetch("http://localhost:3001/api/badge");
    const badges = await response.json();
    console.log("Available badges:", badges);
  } catch (error) {
    console.error("Error fetching badges:", error);
  }
};

testUserBadgeLogic();
