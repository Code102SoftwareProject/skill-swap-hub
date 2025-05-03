import mongoose, { Schema, Document } from "mongoose";

interface ISessionProgress extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  startDate: Date;
  dueDate: Date;
  completionPercentage: number;
  status: "not_started" | "in_progress" | "completed" | "abondoned";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    startDate: { type: Date },
    dueDate: { type: Date },
    completionPercentage: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "abondoned"],
      default: "not_started"
    },
    notes: { type: String },
  },
  { timestamps: true }
);

sessionProgressSchema.index({ userId: 1 });
sessionProgressSchema.index({ sessionId: 1 });
sessionProgressSchema.index({ status: 1 });
sessionProgressSchema.index({ dueDate: 1 });
sessionProgressSchema.index({ userId: 1, status: 1 });

export default mongoose.models.SessionProgress || mongoose.model<ISessionProgress>("SessionProgress", sessionProgressSchema);