import mongoose, { Schema, Document } from "mongoose";

export interface IBadgeAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  badgeId: mongoose.Types.ObjectId;
  assignedAt: Date;
  assignmentContext: string; // e.g., "session_completed", "skill_master", etc.
  createdAt: Date;
  updatedAt: Date;
}

const badgeAssignmentSchema = new Schema<IBadgeAssignment>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    badgeId: { 
      type: Schema.Types.ObjectId, 
      ref: "badge", 
      required: true 
    },
    assignedAt: { 
      type: Date, 
      default: Date.now 
    },
    assignmentContext: { 
      type: String, 
      required: true 
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate badge assignments
badgeAssignmentSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

// Additional indexes for efficient queries
badgeAssignmentSchema.index({ userId: 1 });
badgeAssignmentSchema.index({ badgeId: 1 });
badgeAssignmentSchema.index({ assignmentContext: 1 });

const BadgeAssignment = mongoose.models.BadgeAssignment || mongoose.model<IBadgeAssignment>("BadgeAssignment", badgeAssignmentSchema);

export default BadgeAssignment;
