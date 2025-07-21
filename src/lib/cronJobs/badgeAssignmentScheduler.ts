import cron from "node-cron";
import { assignAllEligibleBadges } from "@/app/api/badge-assignments/badgeService";

// Schedule badge assignment to run daily at midnight (00:00)

const scheduleBadgeAssignment = () => {
  // Run daily at midnight
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log(
        "🚀 Starting daily badge assignment job at:",
        new Date().toISOString()
      );

      try {
        const result = await assignAllEligibleBadges();

        if (result.success) {
          console.log(
            `✅ Badge assignment completed successfully! Total assigned: ${(result as any).totalAssigned || 0}`
          );
          console.log("📊 Results:", JSON.stringify(result, null, 2));
        } else {
          console.error("❌ Badge assignment failed:", (result as any).error);
        }
      } catch (error) {
        console.error("💥 Error in scheduled badge assignment:", error);
      }

      console.log(
        "🏁 Daily badge assignment job completed at:",
        new Date().toISOString()
      );
    },
    {
      timezone: "Asia/Kolkata", // Change to your timezone
    }
  );

  console.log(
    "⏰ Badge assignment cron job scheduled to run daily at midnight"
  );
};

export default scheduleBadgeAssignment;
