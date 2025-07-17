// ReportPostButton.tsx
'use client';

import React, { useState } from 'react';
import { Flag, X, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportPostButtonProps {
	postId: string;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
}

const ReportPostButton: React.FC<ReportPostButtonProps> = ({
	postId,
	className = '',
	size = 'sm',
}) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [reportType, setReportType] = useState('');
	const [description, setDescription] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const reportTypes = [
		{ value: 'spam', label: 'Spam or promotional content' },
		{ value: 'inappropriate_content', label: 'Inappropriate content' },
		{ value: 'harassment', label: 'Harassment or bullying' },
		{ value: 'off_topic', label: 'Off-topic or irrelevant' },
		{ value: 'misinformation', label: 'Misinformation or false claims' },
		{ value: 'copyright', label: 'Copyright violation' },
		{ value: 'other', label: 'Other' },
	];

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!reportType || !description.trim()) {
			return;
		}

		setIsSubmitting(true);

		try {
			// Get the auth token from localStorage
			const token = localStorage.getItem('auth_token');
			
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};

			// Add authorization header if token exists
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const response = await fetch('/api/forum-reports', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					postId,
					reportType,
					description: description.trim(),
				}),
			});

			const data = await response.json();

			if (data.success) {
				setIsSubmitted(true);
				setTimeout(() => {
					setIsModalOpen(false);
					setIsSubmitted(false);
					setReportType('');
					setDescription('');
				}, 2000);
			} else {
				alert(data.message || 'Failed to submit report');
			}
		} catch (error) {
			console.error('Error submitting report:', error);
			alert('Failed to submit report. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const buttonSizes = {
		sm: 'h-8 w-8 p-0',
		md: 'h-10 w-10 p-0',
		lg: 'h-12 w-12 p-0',
	};

	const iconSizes = {
		sm: 'h-4 w-4',
		md: 'h-5 w-5',
		lg: 'h-6 w-6',
	};

	if (isSubmitted) {
		return (
			<div className="flex items-center text-green-600 text-sm">
				<AlertTriangle className="h-4 w-4 mr-1" />
				Report submitted
			</div>
		);
	}

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				className={`${buttonSizes[size]} text-gray-500 hover:text-red-600 hover:bg-red-50 ${className}`}
				onClick={() => setIsModalOpen(true)}
				title="Report this post"
			>
				<Flag className={iconSizes[size]} />
			</Button>

			{/* Report Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full">
						<div className="p-6">
							{/* Header */}
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-gray-900">
									Report Post
								</h3>
								<button
									onClick={() => setIsModalOpen(false)}
									className="text-gray-400 hover:text-gray-600"
									disabled={isSubmitting}
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							{/* Form */}
							<form onSubmit={handleSubmit} className="space-y-4">
								{/* Report Type */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Why are you reporting this post? *
									</label>
									<div className="space-y-2">
										{reportTypes.map((type) => (
											<label
												key={type.value}
												className="flex items-center space-x-2 text-black cursor-pointer"
											>
												<input
													type="radio"
													name="reportType"
													value={type.value}
													checked={reportType === type.value}
													onChange={(e) => setReportType(e.target.value)}
													className="text-primary focus:ring-primary"
													disabled={isSubmitting}
												/>
												<span className="text-sm text-gray-700">
													{type.label}
												</span>
											</label>
										))}
									</div>
								</div>

								{/* Description */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Additional details *
									</label>
									<textarea
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Please provide specific details about why you're reporting this post..."
										className="w-full p-3 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary resize-none"
										rows={4}
										maxLength={1000}
										disabled={isSubmitting}
										required
									/>
									<div className="text-xs text-gray-500 mt-1">
										{description.length}/1000 characters
									</div>
								</div>

								{/* Submit Button */}
								<div className="flex text-black space-x-3 pt-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsModalOpen(false)}
										disabled={isSubmitting}
										className="flex-1 bg-slate-600 hover:bg-slate-700"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={!reportType || !description.trim() || isSubmitting}
										className="flex-1 bg-red-600 hover:bg-red-700 text-white"
									>
										{isSubmitting ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
												Submitting...
											</>
										) : (
											<>
												<Send className="h-4 w-4 mr-2" />
												Submit Report
											</>
										)}
									</Button>
								</div>
							</form>

							{/* Info */}
							<div className="mt-4 p-3 bg-blue-50 rounded-md">
								<p className="text-xs text-blue-800">
									Reports are reviewed by our moderation team and analyzed using AI. 
									False reports may result in action against your account.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default ReportPostButton;