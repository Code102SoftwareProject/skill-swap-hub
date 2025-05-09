import mongoose, { Schema, model, models } from "mongoose";

const notificationTypeSchema = new Schema({
  typeno: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true,
    default: "#3B82F6" // Default blue color
  }
});

// Export the model
export default models.NotificationType || model("NotificationType", notificationTypeSchema);