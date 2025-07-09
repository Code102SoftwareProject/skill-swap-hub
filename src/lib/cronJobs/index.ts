import scheduleBadgeAssignment from "@/lib/cronJobs/badgeAssignmentScheduler";

// Initialize all cron jobs
export const initializeCronJobs = () => {
  console.log("🔄 Initializing cron jobs...");

  // Start badge assignment scheduler
  scheduleBadgeAssignment();

  console.log("✅ All cron jobs initialized successfully!");
};

export default initializeCronJobs;
