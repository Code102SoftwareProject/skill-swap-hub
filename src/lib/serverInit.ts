"use server";

import initializeCronJobs from "@/lib/cronJobs/index";

// Initialize cron jobs when the server starts
let cronJobsInitialized = false;

export async function initServerCronJobs() {
  if (!cronJobsInitialized) {
    initializeCronJobs();
    cronJobsInitialized = true;
  }
}

// Call this function immediately when the module loads
initServerCronJobs();
