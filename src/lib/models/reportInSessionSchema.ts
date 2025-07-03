import mongoose, { Schema, Document } from "mongoose";

interface IReportInSession extends Document {
  sessionId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId; // User who is making the report
  reportedUser: mongoose.Types.ObjectId; // User being reported
  reason: string;
  description: string;
  evidenceFiles: string[]; // Array of file URLs
  
  // Auto-collected data for admin review
  reportedUserLastActive: Date;
  reportedUserWorksCount: number;
  reportingUserWorksCount: number;
  reportedUserWorksDetails: {
    workId: mongoose.Types.ObjectId;
    submissionDate: Date;
    status: 'pending' | 'accepted' | 'rejected';
  }[];
  reportingUserWorksDetails: {
    workId: mongoose.Types.ObjectId;
    submissionDate: Date;
    status: 'pending' | 'accepted' | 'rejected';
  }[];
  
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  adminResponse?: string;
  adminId?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const reportInSessionSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { 
      type: String, 
      required: true,
      enum: [
        'not_submitting_work',
        'not_responsive',
        'poor_quality_work',
        'inappropriate_behavior',
        'not_following_session_terms',
        'other'
      ]
    },
    description: { type: String, required: true },
    evidenceFiles: [{ type: String }], // Array of file URLs
    
    // Auto-collected data
    reportedUserLastActive: { type: Date },
    reportedUserWorksCount: { type: Number, default: 0 },
    reportingUserWorksCount: { type: Number, default: 0 },
    reportedUserWorksDetails: [{
      workId: { type: Schema.Types.ObjectId, ref: "Work" },
      submissionDate: { type: Date },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'] }
    }],
    reportingUserWorksDetails: [{
      workId: { type: Schema.Types.ObjectId, ref: "Work" },
      submissionDate: { type: Date },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'] }
    }],
    
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'dismissed'],
      default: 'pending'
    },
    adminResponse: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for better query performance
reportInSessionSchema.index({ sessionId: 1 });
reportInSessionSchema.index({ reportedBy: 1 });
reportInSessionSchema.index({ reportedUser: 1 });
reportInSessionSchema.index({ status: 1 });
reportInSessionSchema.index({ createdAt: -1 });

export default mongoose.models.ReportInSession || mongoose.model<IReportInSession>("ReportInSession", reportInSessionSchema);
