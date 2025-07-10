'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Send, X } from 'lucide-react';

interface SessionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    _id: string;
    user1Id: { _id: string; firstName: string; lastName: string };
    user2Id: { _id: string; firstName: string; lastName: string };
    skill1Id: { _id: string; skillTitle: string };
    skill2Id: { _id: string; skillTitle: string };
  };
  currentUserId: string;
  onReviewSubmitted: (review: any) => void;
}

export default function SessionReviewModal({ 
  isOpen, 
  onClose, 
  session, 
  currentUserId, 
  onReviewSubmitted 
}: SessionReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isUser1 = session.user1Id._id === currentUserId;
  const otherUser = isUser1 ? session.user2Id : session.user1Id;
  const skillBeingReviewed = isUser1 ? session.skill2Id : session.skill1Id; // The skill the other person taught
  const reviewType = isUser1 ? 'skill_teaching' : 'skill_learning'; // What we're reviewing them for

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
      setHoveredRating(0);
    }
  }, [isOpen]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      alert('Please provide a comment');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session._id,
          reviewerId: currentUserId,
          revieweeId: otherUser._id,
          rating,
          comment,
          skillId: skillBeingReviewed._id,
          reviewType
        })
      });

      const data = await response.json();
      if (data.success) {
        onReviewSubmitted(data.review);
        onClose();
        alert('Review submitted successfully!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <Star
          key={index}
          className={`w-8 h-8 cursor-pointer transition-colors ${
            starValue <= (hoveredRating || rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
        />
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Rate Your Experience</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="text-center">
            <p className="text-gray-600">
              How was your experience learning{' '}
              <span className="font-medium text-blue-600">{skillBeingReviewed.skillTitle}</span>{' '}
              from{' '}
              <span className="font-medium text-blue-600">
                {otherUser.firstName} {otherUser.lastName}
              </span>?
            </p>
          </div>

          {/* Rating Stars */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex items-center justify-center space-x-1">
              {renderStars()}
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">
                {rating > 0 && (
                  <>
                    {rating} out of 5 stars
                    {rating === 1 && ' - Poor'}
                    {rating === 2 && ' - Fair'}
                    {rating === 3 && ' - Good'}
                    {rating === 4 && ' - Very Good'}
                    {rating === 5 && ' - Excellent'}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review</label>
            <textarea
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              placeholder="Share your experience... What did you learn? How was the teaching? Any feedback?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Review Guidelines */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Review Guidelines</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Be honest and constructive in your feedback</li>
              <li>• Focus on the teaching quality and learning experience</li>
              <li>• Avoid personal attacks or inappropriate language</li>
              <li>• Help others make informed decisions about learning from this person</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isLoading || rating === 0 || !comment.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
