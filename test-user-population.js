// Test script to verify user population in reports
const testUserPopulation = async () => {
  try {
    console.log("Testing user population in admin reports...");

    // Test the API endpoint
    const response = await fetch("http://localhost:3000/api/admin/reports");
    const reports = await response.json();

    console.log(`Found ${reports.length} reports`);

    if (reports.length > 0) {
      const firstReport = reports[0];

      console.log("=== First Report Analysis ===");
      console.log("Report ID:", firstReport._id);

      // Check reportedBy user population
      console.log("\n--- Reported By User ---");
      if (firstReport.reportedBy) {
        console.log("✅ reportedBy is populated");
        console.log("  - ID:", firstReport.reportedBy._id);
        console.log(
          "  - Name:",
          `${firstReport.reportedBy.firstName} ${firstReport.reportedBy.lastName}`
        );
        console.log("  - Email:", firstReport.reportedBy.email);
      } else {
        console.log("❌ reportedBy is NOT populated");
      }

      // Check reportedUser population
      console.log("\n--- Reported User ---");
      if (firstReport.reportedUser) {
        console.log("✅ reportedUser is populated");
        console.log("  - ID:", firstReport.reportedUser._id);
        console.log(
          "  - Name:",
          `${firstReport.reportedUser.firstName} ${firstReport.reportedUser.lastName}`
        );
        console.log("  - Email:", firstReport.reportedUser.email);
      } else {
        console.log("❌ reportedUser is NOT populated");
      }

      // Check session population
      console.log("\n--- Session Data ---");
      if (firstReport.sessionId) {
        console.log("✅ sessionId is populated");
        console.log("  - ID:", firstReport.sessionId._id);
        console.log(
          "  - Service 1:",
          firstReport.sessionId.descriptionOfService1
        );
        console.log(
          "  - Service 2:",
          firstReport.sessionId.descriptionOfService2
        );
      } else {
        console.log("❌ sessionId is NOT populated");
      }

      // Summary
      console.log("\n=== SUMMARY ===");
      console.log(
        "User Schema Integration:",
        firstReport.reportedBy && firstReport.reportedUser
          ? "✅ SUCCESS"
          : "❌ FAILED"
      );
    } else {
      console.log("No reports found. Try creating a test report first.");
    }
  } catch (error) {
    console.error("Error testing user population:", error);
  }
};

// If running in browser console
if (typeof window !== "undefined") {
  window.testUserPopulation = testUserPopulation;
  console.log("Run 'testUserPopulation()' in the browser console to test");
}

// If running in Node.js
if (typeof module !== "undefined") {
  module.exports = testUserPopulation;
}
