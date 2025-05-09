import mongoose, { Schema, model, models } from "mongoose";

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false, // Changed from true to false to allow null for broadcast notifications
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
    default: null, // url to redirect when clicked
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model (use existing if already compiled)
export default models.Notification || model("Notification", notificationSchema);
