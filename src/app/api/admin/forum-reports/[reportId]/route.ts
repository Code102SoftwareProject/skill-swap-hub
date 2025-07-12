// route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ForumPostReport from '@/lib/models/forumPostReportSchema';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ reportId: string }> }
) {
	try {
		await dbConnect();

		const { reportId } = await params;

		// TODO: Add admin authentication check here

		const report = await ForumPostReport.findById(reportId)
			.populate({
				path: 'reportedBy',
				select: 'firstName lastName email avatar',
			})
			.populate({
				path: 'postId',
				select: 'title content author likes dislikes replies views createdAt',
			})
			.populate({
				path: 'adminId',
				select: 'username email',
			})
			.lean() as any;

		if (!report) {
			return NextResponse.json(
				{ success: false, message: 'Report not found' },
				{ status: 404 }
			);
		}

		// Auto-update status to under_review if it's still pending and this is first admin access
		if (report.status === 'pending') {
			await ForumPostReport.findByIdAndUpdate(reportId, {
				status: 'under_review',
			});
			report.status = 'under_review';
		}

		return NextResponse.json({
			success: true,
			data: { report },
		});
	} catch (error) {
		console.error('Error fetching forum post report details:', error);
		return NextResponse.json(
			{ success: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
}
