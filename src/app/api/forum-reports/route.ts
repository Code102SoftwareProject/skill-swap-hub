// route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ForumPostReport from '@/lib/models/forumPostReportSchema';
import Post from '@/lib/models/postSchema';
import { Forum } from '@/lib/models/Forum';
import User from '@/lib/models/userSchema';
import GeminiService from '@/lib/services/geminiService';
import { getUserIdFromToken } from '@/utils/jwtAuth';

// Ensure Forum model is registered
Forum;

// POST - Create a new forum post report
export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const userId = getUserIdFromToken(request);
		if (!userId) {
			return NextResponse.json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401 }
			);
		}

		const { postId, reportType, description } = await request.json();

		// Validate input
		if (!postId || !reportType || !description) {
			return NextResponse.json(
				{ success: false, message: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Check if post exists and get post details
		const post = await Post.findById(postId)
			.populate({
				path: 'forumId',
				model: Forum,
				select: 'title'
			})
			.lean() as any;

		if (!post) {
			return NextResponse.json(
				{ success: false, message: 'Post not found' },
				{ status: 404 }
			);
		}

		// Get author details
		const author = await User.findById(post.author._id).select('firstName lastName').lean() as any;
		if (!author) {
			return NextResponse.json(
				{ success: false, message: 'Post author not found' },
				{ status: 404 }
			);
		}

		// Check if user already reported this post
		const existingReport = await ForumPostReport.findOne({
			postId,
			reportedBy: userId,
		});

		if (existingReport) {
			return NextResponse.json(
				{ success: false, message: 'You have already reported this post' },
				{ status: 409 }
			);
		}

		// Prevent self-reporting
		if (post.author._id.toString() === userId) {
			return NextResponse.json(
				{ success: false, message: 'You cannot report your own post' },
				{ status: 400 }
			);
		}

		// Create post snapshot
		const postSnapshot = {
			title: post.title,
			content: post.content,
			imageUrl: post.imageUrl,
			authorId: post.author._id,
			authorName: `${author.firstName} ${author.lastName}`,
			forumId: post.forumId._id || post.forumId,
			forumTitle: (post.forumId as any).title || 'Unknown Forum',
			capturedAt: new Date(),
		};

		// Create the report
		const report = new ForumPostReport({
			postId,
			reportedBy: userId,
			reportType,
			description,
			postSnapshot,
		});

		await report.save();

		// Trigger AI analysis asynchronously
		analyzePostWithAI(report._id.toString(), {
			title: post.title,
			content: post.content,
			imageUrl: post.imageUrl,
			authorName: postSnapshot.authorName,
			forumTitle: postSnapshot.forumTitle,
			reportType,
			reportDescription: description,
		}).catch(error => {
			console.error('AI analysis failed for report:', report._id, error);
		});

		return NextResponse.json(
			{
				success: true,
				message: 'Report submitted successfully',
				reportId: report._id,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating forum post report:', error);
		return NextResponse.json(
			{ success: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// GET - Get user's reports (for regular users)
export async function GET(request: NextRequest) {
	try {
		await dbConnect();

		const userId = getUserIdFromToken(request);
		if (!userId) {
			return NextResponse.json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const status = searchParams.get('status');
		const skip = (page - 1) * limit;

		// Build query
		const query: any = { reportedBy: userId };
		if (status && status !== 'all') {
			query.status = status;
		}

		// Get reports
		const reports = await ForumPostReport.find(query)
			.populate('postId', 'title author')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean();

		const total = await ForumPostReport.countDocuments(query);

		return NextResponse.json({
			success: true,
			data: {
				reports,
				pagination: {
					currentPage: page,
					totalPages: Math.ceil(total / limit),
					totalCount: total,
					limit,
				},
			},
		});
	} catch (error) {
		console.error('Error fetching user reports:', error);
		return NextResponse.json(
			{ success: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Async function to analyze post with AI
async function analyzePostWithAI(reportId: string, postContent: any) {
	try {
		const geminiService = new GeminiService();
		const analysis = await geminiService.analyzeForumPost(postContent);

		// Update the report with AI analysis
		await ForumPostReport.findByIdAndUpdate(reportId, {
			aiAnalysis: analysis,
			...(analysis.recommendedAction === 'dismiss' && analysis.confidence > 0.8
				? { status: 'auto_resolved', resolvedAt: new Date() }
				: {}),
		});

		console.log(`AI analysis completed for report ${reportId}:`, analysis.analysisResult);
	} catch (error) {
		console.error(`AI analysis failed for report ${reportId}:`, error);
	}
}
