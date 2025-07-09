// Email Test CLI Tool
// Run with: node -r dotenv/config scripts/testEmailService.js [test-email@example.com]

const {
  testEmailConfig,
  sendReportEmails,
} = require("../src/lib/emailService");
const mongoose = require("mongoose");

async function testEmailService() {
  console.log("🧪 Testing Email Service Configuration\n");

  try {
    // Test email configuration
    console.log("🔧 Testing email configuration...");
    const isValid = await testEmailConfig();

    if (isValid) {
      console.log("✅ Email configuration is valid");
    } else {
      console.log("❌ Email configuration is invalid");
      console.log(
        "💡 Make sure to set GMAIL_USER and GMAIL_PASS environment variables"
      );
      process.exit(1);
    }

    // Test sending actual emails (if test email provided)
    const testEmail = process.argv[2];

    if (testEmail) {
      console.log("\n📧 Testing email sending...");

      // Create mock report data
      const mockReport = {
        _id: new mongoose.Types.ObjectId(),
        sessionId: { _id: new mongoose.Types.ObjectId() },
        reportedBy: {
          firstName: "John",
          lastName: "Doe",
          email: testEmail,
        },
        reportedUser: {
          firstName: "Jane",
          lastName: "Smith",
          email: testEmail,
        },
        reason: "not_submitting_work",
        description: "Test report for email functionality",
        adminResponse: "This is a test administrative response.",
        createdAt: new Date(),
      };

      // Test warning email
      console.log("📤 Sending test warning email...");
      await sendReportEmails(
        mockReport,
        "warn",
        "This is a test warning message."
      );
      console.log("✅ Warning email sent successfully");

      // Wait a bit before sending suspension email
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test suspension email
      console.log("📤 Sending test suspension email...");
      await sendReportEmails(
        mockReport,
        "suspend",
        "This is a test suspension message."
      );
      console.log("✅ Suspension email sent successfully");

      console.log("\n🎯 Email testing completed successfully!");
      console.log(`📬 Check ${testEmail} for test emails`);
    } else {
      console.log("\n💡 To test email sending, provide a test email address:");
      console.log(
        "   node -r dotenv/config scripts/testEmailService.js your-email@example.com"
      );
    }
  } catch (error) {
    console.error("❌ Email service test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testEmailService();
