import mongoose, { Schema, models } from "mongoose";

const SessionSchema = new Schema({
  userId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in seconds
});

const SessionModel = models.Session || mongoose.model("SessionTime", SessionSchema);
export default SessionModel; 