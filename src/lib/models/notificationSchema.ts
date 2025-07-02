import mongoose, { Schema, model, models } from "mongoose";

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  typeId: {
    type: Schema.Types.ObjectId,
    ref: "NotificationType",
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
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL index - documents will be automatically deleted after 14 days (2 weeks)
    expires: 60 * 60 * 24 * 14 // 14 days in seconds
  },
});

// Alternative: Create TTL index manually
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 });

// Export the model (use existing if already compiled)
export default models.Notification || model("Notification", notificationSchema);
