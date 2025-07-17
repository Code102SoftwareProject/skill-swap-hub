"use client";

import React, { useState } from 'react';
import { 
  Star, 
  Send, 
  X, 
  User,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
  session: any;
  currentUserId: string;
  otherUser: any;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onReviewSubmitted,
  session,
  currentUserId,
  otherUser
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmitReview = async () => {
    if (rating === 0 || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session._id,
          reviewerId: currentUserId,
          revieweeId: otherUser._id,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Reset form
        setRating(0);
        setComment('');
        onReviewSubmitted();
        onClose();
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (ratingValue: number) => {
    switch (ratingValue) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  const otherUserName = otherUser?.firstName ? 
    `${otherUser.firstName} ${otherUser.lastName || ''}`.trim() : 
    'Other participant';

  const displayRating = hoveredRating || rating;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Rate & Review</h2>
              <p className="text-sm text-gray-600">Share your experience with {otherUserName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
              <p className="text-sm text-gray-600">
                {session.user1Id._id === currentUserId 
                  ? `Offered skill: ${session.skill2Id?.skillTitle || 'a skill'}`
                  : `Offered skill: ${session.skill1Id?.skillTitle || 'a skill'}`
                }
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>

          {/* Session Summary */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Session Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Your skill:</span> {
                  session.user1Id._id === currentUserId 
                    ? session.skill1Id?.skillTitle || 'Unknown'
                    : session.skill2Id?.skillTitle || 'Unknown'
                }
              </p>
              <p>
                <span className="font-medium">Their skill:</span> {
                  session.user1Id._id === currentUserId 
                    ? session.skill2Id?.skillTitle || 'Unknown'
                    : session.skill1Id?.skillTitle || 'Unknown'
                }
              </p>
              <p>
                <span className="font-medium">Duration:</span> {
                  (() => {
                    if (session.status === 'completed' && session.updatedAt) {
                      const start = new Date(session.startDate);
                      const end = new Date(session.updatedAt);
                      const diffTime = Math.abs(end.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                    } else if (session.expectedEndDate) {
                      const start = new Date(session.startDate);
                      const expected = new Date(session.expectedEndDate);
                      const diffTime = Math.abs(expected.getTime() - start.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays} day${diffDays !== 1 ? 's' : ''} (expected)`;
                    } else {
                      return 'Duration not specified';
                    }
                  })()
                }
              </p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you rate your experience with {otherUserName}?
              </label>
              
              {/* Star Rating */}
              <div className="flex items-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    className="focus:outline-none transition-all duration-150"
                    disabled={isSubmitting}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= displayRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      } hover:scale-110 transition-transform`}
                    />
                  </button>
                ))}
              </div>
              
              {/* Rating Text */}
              <p className={`text-sm font-medium ${
                displayRating > 0 ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {getRatingText(displayRating)}
              </p>
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your experience (required)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder={`Tell others about your experience working with ${otherUserName}. How was the communication? Were they reliable? Would you recommend them for skill swapping?`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none disabled:opacity-50"
                rows={4}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Be honest and constructive in your feedback
                </p>
                <p className="text-xs text-gray-500">
                  {comment.length}/1000
                </p>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Review Guidelines</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Be honest and fair in your assessment</li>
                  <li>• Focus on communication, reliability, and skill exchange quality</li>
                  <li>• Keep feedback constructive and professional</li>
                  <li>• Reviews help build trust in our skill-swapping community</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitReview}
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
