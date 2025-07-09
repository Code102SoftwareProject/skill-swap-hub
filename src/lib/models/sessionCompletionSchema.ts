import mongoose, { Schema, Document } from "mongoose";

interface ISessionCompletion extends Document {
  sessionId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  rejectedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  // Track which user this completion request is for (user1 or user2)
  requestForUser: 'user1' | 'user2' | 'both';
  createdAt: Date;
  updatedAt: Date;
}

const sessionCompletionSchema = new Schema(
  {
    sessionId: { 
      type: Schema.Types.ObjectId, 
      ref: "Session", 
      required: true 
    },
    requestedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    requestedAt: { 
      type: Date, 
      default: Date.now,
      required: true 
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true
    },
    approvedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
    rejectedBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
    approvedAt: { 
      type: Date 
    },
    rejectedAt: { 
      type: Date 
    },
    rejectionReason: { 
      type: String 
    },
    requestForUser: {
      type: String,
      enum: ['user1', 'user2', 'both'],
      default: 'both',
      required: true
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient querying
sessionCompletionSchema.index({ sessionId: 1 });
sessionCompletionSchema.index({ requestedBy: 1 });
sessionCompletionSchema.index({ status: 1 });
sessionCompletionSchema.index({ sessionId: 1, status: 1 });
sessionCompletionSchema.index({ sessionId: 1, requestedBy: 1 });

// Compound index to prevent duplicate pending requests from same user for same session
sessionCompletionSchema.index(
  { sessionId: 1, requestedBy: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'pending' } 
  }
);

export default mongoose.models.SessionCompletion || mongoose.model<ISessionCompletion>("SessionCompletion", sessionCompletionSchema);
