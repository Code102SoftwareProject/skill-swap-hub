// forumPostReportSchema.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IForumPostReport extends Document {
	_id: string;
	postId: mongoose.Types.ObjectId;
	reportedBy: mongoose.Types.ObjectId;
	reportType: 'spam' | 'inappropriate_content' | 'harassment' | 'off_topic' | 'misinformation' | 'copyright' | 'other';
	description: string;
	status: 'pending' | 'under_review' | 'resolved' | 'dismissed' | 'auto_resolved';
	priority: 'low' | 'medium' | 'high' | 'critical';
	
	// AI Analysis fields
	aiAnalysis?: {
		isAnalyzed: boolean;
		analysisResult: 'safe' | 'potentially_harmful' | 'harmful' | 'requires_review';
		confidence: number; // 0-1
		detectedIssues: string[];
		summary: string;
		recommendedAction: 'dismiss' | 'review' | 'remove' | 'warn_user' | 'suspend_user';
		analysisDate: Date;
		modelUsed: string;
	};
	
	// Admin fields
	adminId?: mongoose.Types.ObjectId;
	adminResponse?: string;
	adminAction?: 'dismiss' | 'warn_user' | 'remove_post' | 'suspend_user' | 'ban_user';
	resolvedAt?: Date;
	
	// Post snapshot (for reference if post gets deleted)
	postSnapshot: {
		title: string;
		content: string;
		imageUrl?: string;
		authorId: mongoose.Types.ObjectId;
		authorName: string;
		forumId: mongoose.Types.ObjectId;
		forumTitle: string;
		capturedAt: Date;
	};
	
	createdAt: Date;
	updatedAt: Date;
}

const ForumPostReportSchema = new Schema<IForumPostReport>(
	{
		postId: {
			type: Schema.Types.ObjectId,
			ref: 'Post',
			required: true,
			index: true,
		},
		reportedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		reportType: {
			type: String,
			enum: ['spam', 'inappropriate_content', 'harassment', 'off_topic', 'misinformation', 'copyright', 'other'],
			required: true,
		},
		description: {
			type: String,
			required: true,
			maxlength: 1000,
		},
		status: {
			type: String,
			enum: ['pending', 'under_review', 'resolved', 'dismissed', 'auto_resolved'],
			default: 'pending',
		},
		priority: {
			type: String,
			enum: ['low', 'medium', 'high', 'critical'],
			default: 'medium',
		},
		aiAnalysis: {
			isAnalyzed: { type: Boolean, default: false },
			analysisResult: {
				type: String,
				enum: ['safe', 'potentially_harmful', 'harmful', 'requires_review'],
			},
			confidence: { type: Number, min: 0, max: 1 },
			detectedIssues: [String],
			summary: String,
			recommendedAction: {
				type: String,
				enum: ['dismiss', 'review', 'remove', 'warn_user', 'suspend_user'],
			},
			analysisDate: Date,
			modelUsed: String,
		},
		adminId: {
			type: Schema.Types.ObjectId,
			ref: 'Admin',
		},
		adminResponse: {
			type: String,
			maxlength: 1000,
		},
		adminAction: {
			type: String,
			enum: ['dismiss', 'warn_user', 'remove_post', 'suspend_user', 'ban_user'],
		},
		resolvedAt: Date,
		postSnapshot: {
			title: { type: String, required: true },
			content: { type: String, required: true },
			imageUrl: String,
			authorId: { type: Schema.Types.ObjectId, required: true },
			authorName: { type: String, required: true },
			forumId: { type: Schema.Types.ObjectId, required: true },
			forumTitle: { type: String, required: true },
			capturedAt: { type: Date, default: Date.now },
		},
	},
	{
		timestamps: true,
	}
);

// Compound indexes for efficient queries
ForumPostReportSchema.index({ postId: 1, reportedBy: 1 }, { unique: true }); // Prevent duplicate reports
ForumPostReportSchema.index({ status: 1, createdAt: -1 });
ForumPostReportSchema.index({ 'aiAnalysis.analysisResult': 1, status: 1 });
ForumPostReportSchema.index({ priority: 1, status: 1 });

const ForumPostReport = mongoose.models.ForumPostReport || mongoose.model<IForumPostReport>('ForumPostReport', ForumPostReportSchema);

export default ForumPostReport;
