// ForumReportsContent.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import {
	AlertTriangle,
	Eye,
	CheckCircle,
	XCircle,
	AlertOctagon,
	RefreshCw,
	Search,
	Filter,
	ChevronDown,
	Flag,
	Bot,
	Clock,
	MessageSquare,
	User,
	Calendar,
	Copy,
	History,
	Layers,
} from 'lucide-react';

interface ForumPostReport {
	_id: string;
	postId: {
		_id: string;
		title: string;
		content: string;
		author: {
			_id: string;
		};
		likes: number;
		dislikes: number;
		replies: number;
		views: number;
		createdAt: string;
	} | null;
	reportedBy: {
		_id: string;
		firstName: string;
		lastName: string;
		email: string;
		avatar?: string;
	};
	reportType: string;
	description: string;
	status: 'pending' | 'under_review' | 'resolved' | 'dismissed' | 'auto_resolved';
	priority: 'low' | 'medium' | 'high' | 'critical';
	aiAnalysis?: {
		isAnalyzed: boolean;
		analysisResult: 'safe' | 'potentially_harmful' | 'harmful' | 'requires_review';
		confidence: number;
		detectedIssues: string[];
		summary: string;
		recommendedAction: string;
		analysisDate: string;
		modelUsed: string;
	};
	adminId?: {
		_id: string;
		username: string;
		email: string;
	};
	adminResponse?: string;
	adminAction?: string;
	postSnapshot: {
		title: string;
		content: string;
		imageUrl?: string;
		authorId: string;
		authorName: string;
		forumId: string;
		forumTitle: string;
		capturedAt: string;
	};
	createdAt: string;
	resolvedAt?: string;
}

const ForumReportsContent: React.FC = () => {
	const [reports, setReports] = useState<ForumPostReport[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedReport, setSelectedReport] = useState<ForumPostReport | null>(null);
	const [processingAction, setProcessingAction] = useState<string | null>(null);

	// Filters and search
	const [statusFilter, setStatusFilter] = useState('all');
	const [priorityFilter, setPriorityFilter] = useState('all');
	const [aiResultFilter, setAiResultFilter] = useState('all');
	const [multiReportFilter, setMultiReportFilter] = useState('all');
	const [searchQuery, setSearchQuery] = useState('');

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	// Helper functions for multiple reports detection
	const getPostReportsCount = useCallback((postId: string) => {
		if (!postId) return { total: 0, pending: 0, resolved: 0 };
		
		const postReports = reports.filter(report => 
			report.postId?._id === postId || 
			report.postSnapshot.authorId === postId // fallback in case postId is null
		);
		
		const pending = postReports.filter(r => 
			r.status === 'pending' || r.status === 'under_review'
		).length;
		
		const resolved = postReports.filter(r => 
			r.status === 'resolved' || r.status === 'dismissed' || r.status === 'auto_resolved'
		).length;
		
		return { total: postReports.length, pending, resolved };
	}, [reports]);

	const hasMultipleReports = useCallback((report: ForumPostReport) => {
		const postId = report.postId?._id;
		if (!postId) return false;
		
		const counts = getPostReportsCount(postId);
		return counts.total > 1;
	}, [getPostReportsCount]);

	const getRelatedReports = useCallback((report: ForumPostReport) => {
		const postId = report.postId?._id;
		if (!postId) return [];
		
		return reports.filter(r => 
			r._id !== report._id && 
			(r.postId?._id === postId || r.postSnapshot.authorId === postId)
		);
	}, [reports]);

	// Load reports
	const fetchReports = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage.toString(),
				limit: '10',
				...(statusFilter !== 'all' && { status: statusFilter }),
				...(priorityFilter !== 'all' && { priority: priorityFilter }),
				...(aiResultFilter !== 'all' && { aiResult: aiResultFilter }),
			});

			const response = await fetch(`/api/admin/forum-reports?${params}`);
			const data = await response.json();

			if (data.success) {
				setReports(data.data.reports);
				setTotalPages(data.data.pagination.totalPages);
				setTotalCount(data.data.pagination.totalCount);
				setError(null);
			} else {
				setError(data.message || 'Failed to fetch reports');
			}
		} catch (err) {
			console.error('Error fetching reports:', err);
			setError('Failed to load reports');
		} finally {
			setLoading(false);
		}
	}, [currentPage, statusFilter, priorityFilter, aiResultFilter]);

	useEffect(() => {
		fetchReports();
	}, [fetchReports]);

	// Filter reports by search query
	const filteredReports = useMemo(() => {
		let filtered = reports;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(report => 
				report.postSnapshot.title.toLowerCase().includes(query) ||
				report.postSnapshot.content.toLowerCase().includes(query) ||
				report.postSnapshot.authorName.toLowerCase().includes(query) ||
				report.reportedBy.firstName.toLowerCase().includes(query) ||
				report.reportedBy.lastName.toLowerCase().includes(query) ||
				report.description.toLowerCase().includes(query)
			);
		}

		// Apply multiple reports filter
		if (multiReportFilter === 'multiple') {
			filtered = filtered.filter(report => hasMultipleReports(report));
		} else if (multiReportFilter === 'single') {
			filtered = filtered.filter(report => !hasMultipleReports(report));
		}

		return filtered;
	}, [reports, searchQuery, multiReportFilter, hasMultipleReports]);

	// Handle admin actions
	const handleAction = async (reportId: string, action: string, adminResponse: string = '') => {
		// Get action details for confirmation
		const getActionDetails = (action: string) => {
			switch (action) {
				case 'dismiss':
					return {
						title: 'Dismiss Report',
						text: 'Are you sure you want to dismiss this report? This action will mark the report as dismissed.',
						icon: 'question' as const,
						confirmButtonText: 'Yes, dismiss it',
						confirmButtonColor: '#6b7280'
					};
				case 'remove_post':
					return {
						title: 'Remove Post',
						text: 'Are you sure you want to remove this post? This action cannot be undone and the post will be permanently deleted.',
						icon: 'warning' as const,
						confirmButtonText: 'Yes, remove it',
						confirmButtonColor: '#dc2626'
					};
				case 'warn_user':
					return {
						title: 'Warn User',
						text: 'Are you sure you want to issue a warning to this user? They will receive a notification about this warning.',
						icon: 'warning' as const,
						confirmButtonText: 'Yes, warn user',
						confirmButtonColor: '#f59e0b'
					};
				default:
					return {
						title: 'Confirm Action',
						text: 'Are you sure you want to perform this action?',
						icon: 'question' as const,
						confirmButtonText: 'Yes, proceed',
						confirmButtonColor: '#3b82f6'
					};
			}
		};

		const actionDetails = getActionDetails(action);

		// Show confirmation dialog
		const result = await Swal.fire({
			title: actionDetails.title,
			text: actionDetails.text,
			icon: actionDetails.icon,
			showCancelButton: true,
			confirmButtonColor: actionDetails.confirmButtonColor,
			cancelButtonColor: '#6b7280',
			confirmButtonText: actionDetails.confirmButtonText,
			cancelButtonText: 'Cancel',
			reverseButtons: true,
			customClass: {
				popup: 'text-black'
			}
		});

		// If user cancelled, return early
		if (!result.isConfirmed) {
			return;
		}

		try {
			setProcessingAction(reportId);

			// Show loading toast
			Swal.fire({
				title: 'Processing...',
				text: 'Please wait while we process your request.',
				allowOutsideClick: false,
				allowEscapeKey: false,
				showConfirmButton: false,
				didOpen: () => {
					Swal.showLoading();
				}
			});

			const response = await fetch('/api/admin/forum-reports', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					reportId,
					action,
					adminResponse,
				}),
			});

			const data = await response.json();

			if (data.success) {
				// Show success message
				await Swal.fire({
					title: 'Success!',
					text: `Action "${actionDetails.title}" has been completed successfully.`,
					icon: 'success',
					confirmButtonColor: '#10b981',
					customClass: {
						popup: 'text-black'
					}
				});

				// Refresh reports
				await fetchReports();
				setSelectedReport(null);
			} else {
				// Show error message
				await Swal.fire({
					title: 'Error!',
					text: data.message || 'Action failed. Please try again.',
					icon: 'error',
					confirmButtonColor: '#dc2626',
					customClass: {
						popup: 'text-black'
					}
				});
			}
		} catch (error) {
			console.error('Error performing action:', error);
			// Show error message
			await Swal.fire({
				title: 'Error!',
				text: 'Action failed. Please try again.',
				icon: 'error',
				confirmButtonColor: '#dc2626',
				customClass: {
					popup: 'text-black'
				}
			});
		} finally {
			setProcessingAction(null);
		}
	};

	// Format helper functions
	const formatReportType = (type: string) => {
		return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'under_review': return 'bg-blue-100 text-blue-800';
			case 'resolved': return 'bg-green-100 text-green-800';
			case 'dismissed': return 'bg-gray-100 text-gray-800';
			case 'auto_resolved': return 'bg-purple-100 text-purple-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'low': return 'bg-green-100 text-green-800';
			case 'medium': return 'bg-yellow-100 text-yellow-800';
			case 'high': return 'bg-orange-100 text-orange-800';
			case 'critical': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const getAiResultColor = (result: string) => {
		switch (result) {
			case 'safe': return 'bg-green-100 text-green-800';
			case 'potentially_harmful': return 'bg-yellow-100 text-yellow-800';
			case 'harmful': return 'bg-red-100 text-red-800';
			case 'requires_review': return 'bg-blue-100 text-blue-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	if (loading && reports.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center text-black  justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Forum Post Reports</h1>
					<p className="text-gray-600 mt-1">
						Review and manage reported forum posts with AI-powered analysis
					</p>
				</div>
				<Button 
					onClick={async () => {
						const result = await Swal.fire({
							title: 'Refresh Reports',
							text: 'Do you want to refresh the reports list?',
							icon: 'question',
							showCancelButton: true,
							confirmButtonColor: '#3b82f6',
							cancelButtonColor: '#6b7280',
							confirmButtonText: 'Yes, refresh',
							cancelButtonText: 'Cancel',
							reverseButtons: true,
							customClass: {
								popup: 'text-black'
							}
						});
						
						if (result.isConfirmed) {
							await fetchReports();
							await Swal.fire({
								title: 'Refreshed!',
								text: 'Reports have been refreshed successfully.',
								icon: 'success',
								timer: 2000,
								showConfirmButton: false,
								customClass: {
									popup: 'text-black'
								}
							});
						}
					}} 
					variant="outline" 
					size="sm"
				>
					<RefreshCw className="h-4 w-4 text-black mr-2" />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center">
							<Flag className="h-8 w-8 text-red-500" />
							<div className="ml-3">
								<p className="text-sm font-medium text-gray-500">Total Reports</p>
								<p className="text-2xl font-bold text-gray-900">{totalCount}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center">
							<Clock className="h-8 w-8 text-yellow-500" />
							<div className="ml-3">
								<p className="text-sm font-medium text-gray-500">Pending</p>
								<p className="text-2xl font-bold text-gray-900">
									{reports.filter(r => r.status === 'pending').length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center">
							<Layers className="h-8 w-8 text-orange-500" />
							<div className="ml-3">
								<p className="text-sm font-medium text-gray-500">Multi-Reported Posts</p>
								<p className="text-2xl font-bold text-gray-900">
									{(() => {
										const postIds = new Set();
										const multiReportedPosts = new Set();
										
										reports.forEach(report => {
											const postId = report.postId?._id;
											if (postId) {
												if (postIds.has(postId)) {
													multiReportedPosts.add(postId);
												} else {
													postIds.add(postId);
												}
											}
										});
										
										return multiReportedPosts.size;
									})()}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center">
							<Bot className="h-8 w-8 text-blue-500" />
							<div className="ml-3">
								<p className="text-sm font-medium text-gray-500">AI Analyzed</p>
								<p className="text-2xl font-bold text-gray-900">
									{reports.filter(r => r.aiAnalysis?.isAnalyzed).length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center">
							<CheckCircle className="h-8 w-8 text-green-500" />
							<div className="ml-3">
								<p className="text-sm font-medium text-gray-500">Resolved</p>
								<p className="text-2xl font-bold text-gray-900">
									{reports.filter(r => r.status === 'resolved' || r.status === 'dismissed' || r.status === 'auto_resolved').length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col lg:flex-row gap-4">
						{/* Search */}
						<div className="flex-1">
							<div className="relative">
								<Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
								<input
									type="text"
									placeholder="Search reports..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10 pr-4 text-black py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
								/>
							</div>
						</div>

						{/* Filters */}
						<div className="flex gap-2 flex-wrap">
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="px-3 py-2 border border-gray-300 text-black rounded-md   "
							>
								<option value="all">All Status</option>
								<option value="pending">Pending</option>
								<option value="under_review">Under Review</option>
								<option value="resolved">Resolved</option>
								<option value="dismissed">Dismissed</option>
								<option value="auto_resolved">Auto Resolved</option>
							</select>

							<select
								value={priorityFilter}
								onChange={(e) => setPriorityFilter(e.target.value)}
								className="px-3 py-2 border border-gray-300 rounded-md  text-black "
							>
								<option value="all">All Priority</option>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="critical">Critical</option>
							</select>

							<select
								value={multiReportFilter}
								onChange={(e) => setMultiReportFilter(e.target.value)}
								className="px-3 py-2 border border-gray-300 rounded-md text-black"
							>
								<option value="all">All Posts</option>
								<option value="multiple">Multiple Reports</option>
								<option value="single">Single Report</option>
							</select>

							<select
								value={aiResultFilter}
								onChange={(e) => setAiResultFilter(e.target.value)}
								className="px-3 py-2 border border-gray-300 rounded-md text-black "
							>
								<option value="all">All AI Results</option>
								<option value="safe">Safe</option>
								<option value="potentially_harmful">Potentially Harmful</option>
								<option value="harmful">Harmful</option>
								<option value="requires_review">Requires Review</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Reports Table */}
			<Card>
				<CardContent className="p-0">
					{filteredReports.length === 0 ? (
						<div className="text-center py-12">
							<Flag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								No Reports Found
							</h3>
							<p className="text-gray-600">
								{searchQuery ? 'No reports match your search criteria.' : 'No forum post reports yet.'}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Post & Reporter
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Report Details
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											AI Analysis
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filteredReports.map((report) => (
										<tr key={report._id} className="hover:bg-gray-50">
											<td className="px-6 py-4">
												<div className="space-y-2">
													{/* Post Info */}
													<div className="relative">
														<div className="flex items-start justify-between">
															<div className="flex-1">
																<h4 className="font-medium text-gray-900 truncate max-w-xs">
																	{report.postSnapshot.title}
																</h4>
																<p className="text-sm text-gray-500">
																	in {report.postSnapshot.forumTitle}
																</p>
																<p className="text-sm text-gray-500">
																	by {report.postSnapshot.authorName}
																</p>
															</div>
															
															{/* Multiple Reports Indicator */}
															{hasMultipleReports(report) && (
																<div className="ml-2 flex flex-col gap-1">
																	{(() => {
																		const counts = getPostReportsCount(report.postId?._id || '');
																		return (
																			<>
																				{counts.total > 1 && (
																					<div className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
																						<Layers className="h-3 w-3 mr-1" />
																						{counts.total} Reports
																					</div>
																				)}
																				{counts.pending > 1 && (
																					<div className="flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
																						<Clock className="h-3 w-3 mr-1" />
																						{counts.pending} Pending
																					</div>
																				)}
																				{counts.resolved > 0 && (
																					<div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
																						<History className="h-3 w-3 mr-1" />
																						{counts.resolved} Resolved
																					</div>
																				)}
																			</>
																		);
																	})()}
																</div>
															)}
														</div>
													</div>
													
													{/* Reporter Info */}
													<div className="pt-2 border-t border-gray-100">
														<p className="text-xs text-gray-400">Reported by:</p>
														<p className="text-sm font-medium text-gray-700">
															{report.reportedBy.firstName} {report.reportedBy.lastName}
														</p>
													</div>
												</div>
											</td>
											<td className="px-6 py-4">
												<div className="space-y-2">
													<Badge className={getPriorityColor(report.priority)}>
														{report.priority.toUpperCase()}
													</Badge>
													<p className="text-sm font-medium text-gray-900">
														{formatReportType(report.reportType)}
													</p>
													<p className="text-sm text-gray-600 truncate max-w-xs">
														{report.description}
													</p>
													<p className="text-xs text-gray-400">
														{new Date(report.createdAt).toLocaleDateString()}
													</p>
												</div>
											</td>
											<td className="px-6 py-4">
												{report.aiAnalysis?.isAnalyzed ? (
													<div className="space-y-2">
														<Badge className={getAiResultColor(report.aiAnalysis.analysisResult)}>
															{report.aiAnalysis.analysisResult.replace(/_/g, ' ')}
														</Badge>
														<div className="flex items-center text-sm text-gray-600">
															<Bot className="h-4 w-4 mr-1" />
															{Math.round(report.aiAnalysis.confidence * 100)}% confidence
														</div>
														<p className="text-xs text-gray-500 max-w-xs">
															{report.aiAnalysis.summary}
														</p>
													</div>
												) : (
													<div className="text-sm text-gray-400">
														<Bot className="h-4 w-4 mr-1 inline" />
														Analyzing...
													</div>
												)}
											</td>
											<td className="px-6 py-4">
												<Badge className={getStatusColor(report.status)}>
													{report.status.replace(/_/g, ' ')}
												</Badge>
											</td>
											<td className="px-6 py-4 text-black">
												<div className="flex flex-wrap gap-2">
													<Button
														size="sm"
														variant="outline"
														onClick={() => setSelectedReport(report)}
														className="flex items-center gap-1"
													>
														<Eye className="h-4 w-4" />
														<span className="hidden sm:inline">View</span>
													</Button>
													
													{/* Show action buttons only for pending and under_review, and hide remove post for resolved */}
													{report.status === 'pending' || report.status === 'under_review' ? (
														<>
															{/* Always show dismiss button for pending/under_review */}
															<Button
																size="sm"
																variant="outline"
																onClick={async () => {
																	const result = await Swal.fire({
																		title: 'Dismiss Report',
																		text: 'Are you sure you want to dismiss this report?',
																		icon: 'question',
																		showCancelButton: true,
																		confirmButtonColor: '#6b7280',
																		cancelButtonColor: '#6b7280',
																		confirmButtonText: 'Yes, dismiss it',
																		cancelButtonText: 'Cancel',
																		reverseButtons: true,
																		customClass: {
																			popup: 'text-black'
																		}
																	});
																	
																	if (result.isConfirmed) {
																		await handleAction(report._id, 'dismiss');
																	}
																}}
																disabled={processingAction === report._id}
																className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
															>
																<XCircle className="h-4 w-4" />
																<span className="hidden sm:inline">Dismiss</span>
															</Button>
															{/* Only show remove post button for pending status */}
															{report.status === 'pending' && (
																<Button
																	size="sm"
																	variant="outline"
																	onClick={async () => {
																		const result = await Swal.fire({
																			title: 'Remove Post',
																			text: 'Are you sure you want to remove this post? This action cannot be undone.',
																			icon: 'warning',
																			showCancelButton: true,
																			confirmButtonColor: '#dc2626',
																			cancelButtonColor: '#6b7280',
																			confirmButtonText: 'Yes, remove it',
																			cancelButtonText: 'Cancel',
																			reverseButtons: true,
																			customClass: {
																				popup: 'text-black'
																			}
																		});
																		
																		if (result.isConfirmed) {
																			await handleAction(report._id, 'remove_post');
																		}
																	}}
																	disabled={processingAction === report._id}
																	className="text-red-600 hover:text-red-800 flex items-center gap-1"
																>
																	<AlertOctagon className="h-4 w-4" />
																	<span className="hidden sm:inline">Remove Post</span>
																</Button>
															)}
														</>
													) : report.status === 'resolved' ? (
														<Badge variant="outline" className="text-xs">
															{report.adminAction || 'Resolved'}
														</Badge>
													) : (
														<Badge variant="outline" className="text-xs">
															{report.adminAction || 'Completed'}
														</Badge>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-gray-500">
						Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} reports
					</div>
					<div className="flex space-x-2">
						<Button
							variant="outline"
							onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
							disabled={currentPage === 1}
						>
							Previous
						</Button>
						<span className="px-3 py-2 text-sm text-gray-700">
							Page {currentPage} of {totalPages}
						</span>
						<Button
							variant="outline"
							onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
							disabled={currentPage === totalPages}
						>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Report Detail Modal */}
			{selectedReport && (
				<ReportDetailModal
					report={selectedReport}
					relatedReports={getRelatedReports(selectedReport)}
					onClose={() => setSelectedReport(null)}
					onAction={handleAction}
					isProcessing={processingAction === selectedReport._id}
				/>
			)}
		</div>
	);
};

// Report Detail Modal Component
interface ReportDetailModalProps {
	report: ForumPostReport;
	relatedReports: ForumPostReport[];
	onClose: () => void;
	onAction: (reportId: string, action: string, adminResponse?: string) => Promise<void>;
	isProcessing: boolean;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
	report,
	relatedReports,
	onClose,
	onAction,
	isProcessing,
}) => {
	const [adminResponse, setAdminResponse] = useState('');
	const [selectedAction, setSelectedAction] = useState('');

	const actions = [
		{ value: 'dismiss', label: 'Dismiss Report', color: 'text-gray-600', icon: XCircle },
		...(report.status === 'pending' ? [{ value: 'remove_post', label: 'Remove Post', color: 'text-red-600', icon: AlertOctagon }] : []),
		{ value: 'warn_user', label: 'Warn User', color: 'text-yellow-600', icon: AlertTriangle },
	];

	const handleSubmit = async () => {
		if (!selectedAction) return;

		// Get action details for confirmation
		const getActionDetails = (action: string) => {
			switch (action) {
				case 'dismiss':
					return { title: 'Dismiss Report', text: 'Are you sure you want to dismiss this report?' };
				case 'remove_post':
					return { title: 'Remove Post', text: 'Are you sure you want to remove this post? This action cannot be undone.' };
				case 'warn_user':
					return { title: 'Warn User', text: 'Are you sure you want to issue a warning to this user?' };
				default:
					return { title: 'Confirm Action', text: 'Are you sure you want to perform this action?' };
			}
		};

		const actionDetails = getActionDetails(selectedAction);

		// Show confirmation dialog
		const result = await Swal.fire({
			title: actionDetails.title,
			text: actionDetails.text,
			icon: selectedAction === 'remove_post' ? 'warning' : 'question',
			showCancelButton: true,
			confirmButtonColor: selectedAction === 'remove_post' ? '#dc2626' : '#3b82f6',
			cancelButtonColor: '#6b7280',
			confirmButtonText: `Yes, ${selectedAction.replace('_', ' ')}`,
			cancelButtonText: 'Cancel',
			reverseButtons: true,
			customClass: {
				popup: 'text-black'
			}
		});

		// If user cancelled, return early
		if (!result.isConfirmed) {
			return;
		}

		await onAction(report._id, selectedAction, adminResponse);
	};

	return (
		<div className="fixed inset-0 bg-black text-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-bold text-gray-900">Report Details</h2>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600"
							disabled={isProcessing}
						>
							<XCircle className="h-6 w-6" />
						</button>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Left Column - Report Info */}
						<div className="space-y-6">
							{/* Post Snapshot */}
							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Reported Post</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<h3 className="font-semibold text-gray-900">
											{report.postSnapshot.title}
										</h3>
										<div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
											{report.postSnapshot.content}
										</div>
										<div className="flex items-center justify-between text-sm text-gray-500">
											<span>By {report.postSnapshot.authorName}</span>
											<span>in {report.postSnapshot.forumTitle}</span>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Report Details */}
							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Report Information</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div>
											<label className="text-sm font-medium text-gray-700">Type:</label>
											<p className="text-sm text-gray-900">
												{report.reportType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
											</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">Description:</label>
											<p className="text-sm text-gray-900">{report.description}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">Reporter:</label>
											<p className="text-sm text-gray-900">
												{report.reportedBy.firstName} {report.reportedBy.lastName}
											</p>
											<p className="text-xs text-gray-500">{report.reportedBy.email}</p>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">Date:</label>
											<p className="text-sm text-gray-900">
												{new Date(report.createdAt).toLocaleString()}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Related Reports */}
							{relatedReports.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-sm flex items-center">
											<Layers className="h-4 w-4 mr-2" />
											Related Reports ({relatedReports.length})
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3 max-h-60 overflow-y-auto">
											{relatedReports.map((relatedReport) => (
												<div key={relatedReport._id} className="border rounded-lg p-3 bg-gray-50">
													<div className="flex items-center justify-between mb-2">
														<div className="flex items-center gap-2">
															<Badge className={relatedReport.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
																relatedReport.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
																relatedReport.status === 'resolved' ? 'bg-green-100 text-green-800' :
																relatedReport.status === 'dismissed' ? 'bg-gray-100 text-gray-800' :
																'bg-purple-100 text-purple-800'}>
																{relatedReport.status.replace(/_/g, ' ')}
															</Badge>
															<Badge className={relatedReport.priority === 'low' ? 'bg-green-100 text-green-800' :
																relatedReport.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
																relatedReport.priority === 'high' ? 'bg-orange-100 text-orange-800' :
																'bg-red-100 text-red-800'}>
																{relatedReport.priority}
															</Badge>
														</div>
														<span className="text-xs text-gray-500">
															{new Date(relatedReport.createdAt).toLocaleDateString()}
														</span>
													</div>
													<div className="space-y-1">
														<p className="text-sm font-medium text-gray-900">
															{relatedReport.reportType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
														</p>
														<p className="text-xs text-gray-600 line-clamp-2">
															{relatedReport.description}
														</p>
														<p className="text-xs text-gray-500">
															Reported by: {relatedReport.reportedBy.firstName} {relatedReport.reportedBy.lastName}
														</p>
														{relatedReport.adminAction && (
															<p className="text-xs text-blue-600">
																Action: {relatedReport.adminAction.replace(/_/g, ' ')}
															</p>
														)}
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}
						</div>

						{/* Right Column - AI Analysis & Actions */}
						<div className="space-y-6">
							{/* AI Analysis */}
							{report.aiAnalysis?.isAnalyzed && (
								<Card>
									<CardHeader>
										<CardTitle className="text-sm flex items-center">
											<Bot className="h-4 w-4 mr-2" />
											AI Analysis
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div>
												<label className="text-sm font-medium text-gray-700">Result:</label>
												<div className="mt-1">
													<Badge className={report.aiAnalysis.analysisResult === 'safe' ? 'bg-green-100 text-green-800' :
														report.aiAnalysis.analysisResult === 'potentially_harmful' ? 'bg-yellow-100 text-yellow-800' :
														report.aiAnalysis.analysisResult === 'harmful' ? 'bg-red-100 text-red-800' :
														'bg-blue-100 text-blue-800'}>
														{report.aiAnalysis.analysisResult.replace(/_/g, ' ')}
													</Badge>
												</div>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">Confidence:</label>
												<p className="text-sm text-gray-900">
													{Math.round(report.aiAnalysis.confidence * 100)}%
												</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">Summary:</label>
												<p className="text-sm text-gray-900">{report.aiAnalysis.summary}</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">Recommended Action:</label>
												<p className="text-sm text-gray-900 capitalize">
													{report.aiAnalysis.recommendedAction.replace(/_/g, ' ')}
												</p>
											</div>
											{report.aiAnalysis.detectedIssues.length > 0 && (
												<div>
													<label className="text-sm font-medium text-gray-700">Detected Issues:</label>
													<ul className="text-sm text-gray-900 list-disc list-inside">
														{report.aiAnalysis.detectedIssues.map((issue, index) => (
															<li key={index}>{issue}</li>
														))}
													</ul>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Admin Actions */}
							{(report.status === 'pending' || report.status === 'under_review') && (
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Admin Actions</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{/* Action Selection */}
											<div>
												<label className="text-sm font-medium text-gray-700 mb-2 block">
													Choose Action:
												</label>
												<div className="space-y-2">
													{actions.map((action) => (
														<label key={action.value} className="flex items-center space-x-2 cursor-pointer">
															<input
																type="radio"
																name="action"
																value={action.value}
																checked={selectedAction === action.value}
																onChange={(e) => setSelectedAction(e.target.value)}
																className="text-primary focus:ring-primary"
															/>
															<action.icon className={`h-4 w-4 ${action.color}`} />
															<span className="text-sm text-gray-700">{action.label}</span>
														</label>
													))}
												</div>
											</div>

											{/* Admin Response */}
											<div>
												<label className="text-sm font-medium text-gray-700 mb-2 block">
													Admin Response:
												</label>
												<textarea
													value={adminResponse}
													onChange={(e) => setAdminResponse(e.target.value)}
													placeholder="Provide details about your decision..."
													className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary resize-none"
													rows={4}
													maxLength={1000}
												/>
												<div className="text-xs text-gray-500 mt-1">
													{adminResponse.length}/1000 characters
												</div>
											</div>

											{/* Submit Button */}
											<Button
												onClick={handleSubmit}
												disabled={!selectedAction || isProcessing}
												className="w-full"
											>
												{isProcessing ? (
													<>
														<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
														Processing...
													</>
												) : (
													'Submit Action'
												)}
											</Button>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Previous Admin Action */}
							{(report.status === 'resolved' || report.status === 'dismissed') && report.adminResponse && (
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Admin Decision</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div>
												<label className="text-sm font-medium text-gray-700">Action Taken:</label>
												<p className="text-sm text-gray-900 capitalize">
													{report.adminAction?.replace(/_/g, ' ') || 'Completed'}
												</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">Admin Response:</label>
												<p className="text-sm text-gray-900">{report.adminResponse}</p>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">Resolved At:</label>
												<p className="text-sm text-gray-900">
													{report.resolvedAt ? new Date(report.resolvedAt).toLocaleString() : 'N/A'}
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ForumReportsContent;
