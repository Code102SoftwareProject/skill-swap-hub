import mongoose, { Schema, Document } from "mongoose";

interface ISessionCancel extends Document {
  sessionId: mongoose.Types.ObjectId;
  initiatorId: mongoose.Types.ObjectId; // User who initiated the cancellation
  reason: string;
  description: string;
  evidenceFiles: string[]; // Array of photo file URLs as evidence
  createdAt: Date;
  
  // Response from other user
  responseStatus: "pending" | "agreed" | "disputed";
  responseDate?: Date;
  responseDescription?: string;
  responseEvidenceFiles?: string[]; // Evidence from other user
  workCompletionPercentage?: number; // How much work completed before cancellation
  
  // Final resolution
  finalNote?: string; // Second message from initiator
  resolution: "pending" | "canceled" | "partial_completion" | "continued";
  resolvedDate?: Date;
}

const sessionCancelSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    initiatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    evidenceFiles: [{ type: String }], // Array of photo file URLs
    
    // Response from other user
    responseStatus: {
      type: String,
      enum: ["pending", "agreed", "disputed"],
      default: "pending"
    },
    responseDate: { type: Date },
    responseDescription: { type: String },
    responseEvidenceFiles: [{ type: String }],
    workCompletionPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Final resolution
    finalNote: { type: String },
    resolution: {
      type: String,
      enum: ["pending", "canceled", "partial_completion", "continued"],
      default: "pending"
    },
    resolvedDate: { type: Date }
  },
  { timestamps: true }
);

// Create indexes for efficient queries
sessionCancelSchema.index({ sessionId: 1 });
sessionCancelSchema.index({ initiatorId: 1 });
sessionCancelSchema.index({ responseStatus: 1 });
sessionCancelSchema.index({ resolution: 1 });

export default mongoose.models.SessionCancel || mongoose.model<ISessionCancel>("SessionCancel", sessionCancelSchema);