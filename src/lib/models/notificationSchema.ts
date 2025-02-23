import mongoose, { Schema, model, models } from "mongoose";

const NOTIFICATION_TYPES = {
  1: "NEW_SKILL_MATCH_FOUND",
  2: "NEW_MESSAGE_RECEIVED",
  3: "SESSION_REQUEST",
  4: "SESSION_REQUEST_APPROVED",
  5: "MEETING_REQUEST",
  6: "MEETING_APPROVED_AND_SCHEDULED",
  7: "FEEDBACK_RECEIVED",
  8: "SYSTEM_MAINTENANCE_ALERT",
  9: "NEW_ACCOMPLISHMENT_BADGE_RECEIVED",
};

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    required: true,
  },
  description: {
    type: String, 
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  targetDestination: {
    type: String,
    default: null, // url to redirect when clicked
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model (use existing if already compiled)
export default models.Notification || model("Notification", notificationSchema);
