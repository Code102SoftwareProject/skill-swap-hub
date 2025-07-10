// Test script for Admin Report Management System
// Run with: node -r dotenv/config scripts/testAdminReports.js

const mongoose = require("mongoose");
const fetch = require("node-fetch");

// Import models
const ReportInSession =
  require("../src/lib/models/reportInSessionSchema").default;
const User = require("../src/lib/models/userSchema").default;
const Session = require("../src/lib/models/sessionSchema").default;

const API_BASE = "http://localhost:3000/api/admin/reports";

async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/skillswaphub"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function testReportsList() {
  console.log("\n🧪 Testing GET /api/admin/reports");

  try {
    const response = await fetch(`${API_BASE}?status=pending&page=1&limit=5`);
    const data = await response.json();

    if (data.success) {
      console.log("✅ Reports list retrieved successfully");
      console.log(`📊 Found ${data.data.reports.length} reports`);
      console.log("📈 Status summary:", data.data.statusSummary);
      return data.data.reports[0]; // Return first report for further testing
    } else {
      console.log("❌ Failed to retrieve reports:", data.message);
    }
  } catch (error) {
    console.error("❌ Error testing reports list:", error.message);
  }
}

async function testReportDetails(reportId) {
  console.log("\n🧪 Testing GET /api/admin/reports/[id]");

  try {
    const response = await fetch(`${API_BASE}/${reportId}`);
    const data = await response.json();

    if (data.success) {
      console.log("✅ Report details retrieved successfully");
      console.log(`📋 Report ID: ${data.data.report._id}`);
      console.log(`📋 Status: ${data.data.report.status}`);
      console.log(`📋 Reason: ${data.data.report.reason}`);
      return data.data.report;
    } else {
      console.log("❌ Failed to retrieve report details:", data.message);
    }
  } catch (error) {
    console.error("❌ Error testing report details:", error.message);
  }
}

async function testReportAction(reportId, action = "warn") {
  console.log(`\n🧪 Testing PATCH /api/admin/reports/[id]/action (${action})`);

  try {
    // Create a dummy admin ID for testing
    const adminId = new mongoose.Types.ObjectId();

    const response = await fetch(`${API_BASE}/${reportId}/action`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        adminMessage: `Test ${action} action - This is a test administrative response. The reported behavior violates our community guidelines.`,
        adminId: adminId.toString(),
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Report resolved with ${action} action`);
      console.log(`📧 Email notifications should be sent`);
      return data.data.report;
    } else {
      console.log(`❌ Failed to resolve report with ${action}:`, data.message);
    }
  } catch (error) {
    console.error("❌ Error testing report action:", error.message);
  }
}

async function testEmailConfig() {
  console.log("\n🧪 Testing email configuration");

  try {
    // Email service has been replaced with mailto links
    console.log("⚠️ Email service using nodemailer has been deprecated");
    console.log("✅ Using mailto links in frontend instead");
    return true;
  } catch (error) {
    console.error("❌ Error testing email config:", error.message);
    console.log("💡 This function is deprecated as we now use mailto links");
    return false;
  }
}

async function createTestReport() {
  console.log("\n🧪 Creating test report for testing");

  try {
    // Find existing users and sessions
    const users = await User.find().limit(2);
    const sessions = await Session.find().limit(1);

    if (users.length < 2) {
      console.log("❌ Need at least 2 users to create test report");
      return null;
    }

    if (sessions.length < 1) {
      console.log("❌ Need at least 1 session to create test report");
      return null;
    }

    const testReport = new ReportInSession({
      sessionId: sessions[0]._id,
      reportedBy: users[0]._id,
      reportedUser: users[1]._id,
      reason: "not_submitting_work",
      description:
        "Test report for admin system testing - User has not submitted any work despite multiple reminders.",
      evidenceFiles: [],
      reportedUserLastActive: new Date(),
      reportedUserWorksCount: 0,
      reportingUserWorksCount: 2,
      reportedUserWorksDetails: [],
      reportingUserWorksDetails: [],
      status: "pending",
    });

    await testReport.save();
    console.log("✅ Test report created:", testReport._id);
    return testReport._id;
  } catch (error) {
    console.error("❌ Error creating test report:", error.message);
    return null;
  }
}

async function runAllTests() {
  console.log("🚀 Starting Admin Report Management System Tests\n");

  await connectDB();

  // Test email configuration first
  await testEmailConfig();

  // Create a test report if needed
  let testReportId = await createTestReport();

  // Test listing reports
  const reports = await testReportsList();

  // Use existing report or created test report
  const reportId = testReportId || (reports && reports._id);

  if (reportId) {
    // Test report details
    const report = await testReportDetails(reportId);

    if (report && report.status !== "resolved") {
      // Test report action (warn)
      await testReportAction(reportId, "warn");
    } else {
      console.log(
        "⚠️  Report already resolved or no report available for action testing"
      );
    }
  } else {
    console.log("⚠️  No reports available for testing");
  }

  console.log("\n🎯 Tests completed!");

  // Close database connection
  await mongoose.connection.close();
  console.log("✅ Database connection closed");
}

// Run the tests
runAllTests().catch(console.error);
