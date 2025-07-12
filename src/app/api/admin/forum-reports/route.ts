// route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ForumPostReport from '@/lib/models/forumPostReportSchema';
import Post from '@/lib/models/postSchema';
import { Forum } from '@/lib/models/Forum';
import User from '@/lib/models/userSchema';
import Admin from '@/lib/models/adminSchema';
import { getUserIdFromToken } from '@/utils/jwtAuth';

// Ensure Forum model is registered
Forum;

// GET - Get all forum post reports for admin dashboard
export async function GET(request: NextRequest) {
	try {
		await dbConnect();

		// TODO: Add admin authentication check here
		// For now, we'll proceed without admin check for initial testing

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const status = searchParams.get('status');
		const priority = searchParams.get('priority');
		const aiAnalysisResult = searchParams.get('aiResult');
		const sortBy = searchParams.get('sortBy') || 'createdAt';
		const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
		const skip = (page - 1) * limit;

		// Build query
		const query: any = {};
		if (status && status !== 'all') {
			query.status = status;
		}
		if (priority && priority !== 'all') {
			query.priority = priority;
		}
		if (aiAnalysisResult && aiAnalysisResult !== 'all') {
			query['aiAnalysis.analysisResult'] = aiAnalysisResult;
		}

		// Get reports with populated fields
		const reports = await ForumPostReport.find(query)
			.populate({
				path: 'reportedBy',
				select: 'firstName lastName email avatar',
			})
			.populate({
				path: 'postId',
				select: 'title content author likes dislikes replies views',
				populate: {
					path: 'author._id',
					model: 'User',
					select: 'firstName lastName email',
				},
			})
			.populate({
				path: 'adminId',
				select: 'username email',
			})
			.sort({ [sortBy]: sortOrder })
			.skip(skip)
			.limit(limit)
			.lean();

		const total = await ForumPostReport.countDocuments(query);

		// Get status summary
		const statusSummary = await ForumPostReport.aggregate([
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 },
				},
			},
		]);

		// Get AI analysis summary
		const aiSummary = await ForumPostReport.aggregate([
			{
				$match: { 'aiAnalysis.isAnalyzed': true },
			},
			{
				$group: {
					_id: '$aiAnalysis.analysisResult',
					count: { $sum: 1 },
				},
			},
		]);

		return NextResponse.json({
			success: true,
			data: {
				reports,
				pagination: {
					currentPage: page,
					totalPages: Math.ceil(total / limit),
					totalCount: total,
					limit,
					hasNext: page < Math.ceil(total / limit),
					hasPrev: page > 1,
				},
				statusSummary: statusSummary.reduce((acc, item) => {
					acc[item._id] = item.count;
					return acc;
				}, {} as Record<string, number>),
				aiSummary: aiSummary.reduce((acc, item) => {
					acc[item._id] = item.count;
					return acc;
				}, {} as Record<string, number>),
			},
		});
	} catch (error) {
		console.error('Error fetching forum post reports:', error);
		return NextResponse.json(
			{ success: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// PATCH - Update report status or resolve report
export async function PATCH(request: NextRequest) {
	try {
		await dbConnect();

		// TODO: Add admin authentication check here
		// const adminId = getAdminIdFromToken(request);
		// if (!adminId) {
		// 	return NextResponse.json(
		// 		{ success: false, message: 'Unauthorized' },
		// 		{ status: 401 }
		// 	);
		// }

		const { reportId, action, adminResponse, priority } = await request.json();

		if (!reportId) {
			return NextResponse.json(
				{ success: false, message: 'Report ID is required' },
				{ status: 400 }
			);
		}

		// Find the report
		const report = await ForumPostReport.findById(reportId)
			.populate('postId')
			.populate('reportedBy', 'firstName lastName email');

		if (!report) {
			return NextResponse.json(
				{ success: false, message: 'Report not found' },
				{ status: 404 }
			);
		}

		// Update fields based on action
		const updateData: any = {};

		if (priority) {
			updateData.priority = priority;
		}

		if (adminResponse) {
			updateData.adminResponse = adminResponse;
		}

		// Helper function to send notification
		const sendNotification = async (userId: string, typeno: number, description: string) => {
			try {
				await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notification`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						userId,
						typeno,
						description,
						targetDestination: '/forum',
						broadcast: false,
					}),
				});
			} catch (error) {
				console.error('Error sending notification:', error);
			}
		};

		switch (action) {
			case 'dismiss':
				updateData.status = 'dismissed';
				updateData.resolvedAt = new Date();
				
				// Send notification to reporter (type 23 - Report Dismissed)
				if (report.reportedBy?._id) {
					await sendNotification(
						report.reportedBy._id.toString(),
						23,
						'Your forum post report has been reviewed and dismissed. No action was taken on the reported content.'
					);
				}
				break;

			case 'mark_under_review':
				updateData.status = 'under_review';
				break;

			case 'remove_post':
				// Mark post as deleted/hidden
				if (report.postId) {
					await Post.findByIdAndUpdate(report.postId._id, {
						isDeleted: true,
						deletedReason: 'Removed due to violation',
						deletedAt: new Date(),
					});
				}
				updateData.status = 'resolved';
				updateData.adminAction = 'remove_post';
				updateData.resolvedAt = new Date();
				
				// Send notifications
				if (report.postSnapshot?.authorId) {
					// Send notification to post author (type 25 - Post Removed)
					await sendNotification(
						report.postSnapshot.authorId.toString(),
						25,
						`Your forum post has been removed for violating community guidelines. ${adminResponse ? 'Reason: ' + adminResponse : ''}`
					);
				}
				if (report.reportedBy?._id) {
					// Send notification to reporter
					await sendNotification(
						report.reportedBy._id.toString(),
						23,
						'Thank you for your report. The reported post has been removed for violating community guidelines.'
					);
				}
				break;

			case 'warn_user':
				// TODO: Implement user warning system
				updateData.status = 'resolved';
				updateData.adminAction = 'warn_user';
				updateData.resolvedAt = new Date();
				
				// Send notifications
				if (report.postSnapshot?.authorId) {
					// Send warning to post author (type 24 - Warning)
					await sendNotification(
						report.postSnapshot.authorId.toString(),
						24,
						`You have received a warning for your forum post. Please review our community guidelines. ${adminResponse ? 'Details: ' + adminResponse : ''}`
					);
				}
				if (report.reportedBy?._id) {
					// Send notification to reporter
					await sendNotification(
						report.reportedBy._id.toString(),
						23,
						'Thank you for your report. The reported user has been warned about their behavior.'
					);
				}
				break;

			case 'suspend_user':
				// Update user suspension status
				if (report.postSnapshot?.authorId) {
					await User.findByIdAndUpdate(report.postSnapshot.authorId, {
						'suspension.isSuspended': true,
						'suspension.suspendedAt': new Date(),
						'suspension.reason': `Forum post violation: ${adminResponse || 'Inappropriate content'}`,
					});
					
					// Send suspension notification to user (type 26 - Account Suspended)
					await sendNotification(
						report.postSnapshot.authorId.toString(),
						26,
						`Your account has been suspended due to forum violations. ${adminResponse ? 'Reason: ' + adminResponse : ''} Please contact support if you have questions.`
					);
				}
				if (report.reportedBy?._id) {
					// Send notification to reporter
					await sendNotification(
						report.reportedBy._id.toString(),
						23,
						'Thank you for your report. The reported user has been suspended for violating community guidelines.'
					);
				}
				updateData.status = 'resolved';
				updateData.adminAction = 'suspend_user';
				updateData.resolvedAt = new Date();
				break;

			case 'ban_user':
				// Implement user ban
				if (report.postSnapshot?.authorId) {
					await User.findByIdAndUpdate(report.postSnapshot.authorId, {
						'suspension.isSuspended': true,
						'suspension.suspendedAt': new Date(),
						'suspension.reason': `Permanent ban: ${adminResponse || 'Severe violation'}`,
						'suspension.isPermanent': true,
					});
					
					// Send ban notification to user (type 27 - Account Banned)
					await sendNotification(
						report.postSnapshot.authorId.toString(),
						27,
						`Your account has been permanently banned due to severe violations of our community guidelines. ${adminResponse ? 'Reason: ' + adminResponse : ''}`
					);
				}
				if (report.reportedBy?._id) {
					// Send notification to reporter
					await sendNotification(
						report.reportedBy._id.toString(),
						23,
						'Thank you for your report. The reported user has been banned for severe violations of community guidelines.'
					);
				}
				updateData.status = 'resolved';
				updateData.adminAction = 'ban_user';
				updateData.resolvedAt = new Date();
				break;

			default:
				return NextResponse.json(
					{ success: false, message: 'Invalid action' },
					{ status: 400 }
				);
		}

		// Update the report
		const updatedReport = await ForumPostReport.findByIdAndUpdate(
			reportId,
			updateData,
			{ new: true }
		);

		return NextResponse.json({
			success: true,
			message: `Report ${action} successfully`,
			data: { report: updatedReport },
		});
	} catch (error) {
		console.error('Error updating forum post report:', error);
		return NextResponse.json(
			{ success: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
}
