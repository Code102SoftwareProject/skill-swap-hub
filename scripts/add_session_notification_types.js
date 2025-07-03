// MongoDB shell script to add session-related notification types
// Run this script in MongoDB shell or MongoDB Compass

// Connect to your database first, then run:
// use your_database_name

// Add ALL session-related notification types (excluding SESSION_REQUEST=3 and SESSION_REQUEST_APPROVED=4 which already exist)
db.notificationtypes.insertMany([
  // Work-Related Notifications (typeno 11-14)
  {
    typeno: 11,
    name: "WORK_SUBMITTED",
    color: "#3B82F6" // Blue - When someone submits work in your session
  },
  {
    typeno: 12,
    name: "WORK_ACCEPTED",
    color: "#10B981" // Green - When your submitted work is accepted
  },
  {
    typeno: 13,
    name: "WORK_REJECTED",
    color: "#EF4444" // Red - When your submitted work needs improvement
  },
  {
    typeno: 14,
    name: "WORK_REVIEW_PENDING",
    color: "#F59E0B" // Amber - Reminder when work is waiting for your review
  },
  
  // Progress-Related Notifications (typeno 15-16)
  {
    typeno: 15,
    name: "PROGRESS_UPDATED",
    color: "#8B5CF6" // Purple - When session partner updates their progress
  },
  {
    typeno: 16,
    name: "PROGRESS_MILESTONE",
    color: "#06B6D4" // Cyan - When progress reaches certain milestones (50%, 100%)
  },
  
  // Report-Related Notifications (typeno 17-20)
  {
    typeno: 17,
    name: "REPORT_SUBMITTED",
    color: "#DC2626" // Red - When a report is submitted against you
  },
  {
    typeno: 18,
    name: "REPORT_ADMIN_RESPONSE",
    color: "#7C3AED" // Purple - When admin responds to your report or report against you
  },
  {
    typeno: 19,
    name: "REPORT_RESOLVED",
    color: "#059669" // Green - When a report case is resolved
  },
  {
    typeno: 20,
    name: "REPORT_DISMISSED",
    color: "#6B7280" // Gray - When a report is dismissed by admin
  },
  
  // Session Management Notifications (typeno 21-23)
  {
    typeno: 21,
    name: "SESSION_REMINDER",
    color: "#F97316" // Orange - Reminders for inactive sessions
  },
  {
    typeno: 22,
    name: "SESSION_COMPLETED",
    color: "#10B981" // Green - When both users complete their session
  },
  {
    typeno: 23,
    name: "SESSION_DEADLINE_APPROACHING",
    color: "#EF4444" // Red - When session deadline is approaching
  }
]);

// Verify the insertion
print("Notification types added successfully!");
print("Total notification types in database:");
print(db.notificationtypes.countDocuments());

// Display all notification types to verify
print("\nAll notification types:");
db.notificationtypes.find().sort({typeno: 1}).forEach(function(doc) {
  print("typeno: " + doc.typeno + ", name: " + doc.name + ", color: " + doc.color);
});
