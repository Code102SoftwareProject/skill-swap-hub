'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';

interface ReviewFormProps {
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

export default function ReviewForm({ session, currentUserId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isUser1 = session.user1Id._id === currentUserId;
  const otherUser = isUser1 ? session.user2Id : session.user1Id;
  const skillBeingReviewed = isUser1 ? session.skill2Id : session.skill1Id; // The skill the other person taught
  const reviewType = isUser1 ? 'skill_teaching' : 'skill_learning'; // What we're reviewing them for

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
        // Reset form
        setRating(0);
        setComment('');
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Rate Your Experience</CardTitle>
        <p className="text-sm text-gray-600">
          How was your experience learning <span className="font-medium">{skillBeingReviewed.skillTitle}</span> from{' '}
          <span className="font-medium">{otherUser.firstName} {otherUser.lastName}</span>?
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rating Stars */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex items-center space-x-1">
            {renderStars()}
            <span className="ml-2 text-sm text-gray-600">
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
            className="min-h-[100px] w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitReview}
            disabled={isLoading || rating === 0 || !comment.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to display existing reviews
interface ReviewDisplayProps {
  reviews: Array<{
    _id: string;
    rating: number;
    comment: string;
    createdAt: string;
    reviewerId: { firstName: string; lastName: string; avatar?: string };
    skillId: { skillTitle: string };
    reviewType: string;
  }>;
  averageRating?: number;
  totalReviews?: number;
}

export function ReviewDisplay({ reviews, averageRating, totalReviews }: ReviewDisplayProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-4">
      {/* Average Rating Summary */}
      {averageRating && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  {renderStars(Math.round(averageRating))}
                </div>
                <div className="text-sm text-gray-600">
                  Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      {reviews.map((review) => (
        <Card key={review._id}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {review.reviewerId.avatar ? (
                  <img
                    src={review.reviewerId.avatar}
                    alt={`${review.reviewerId.firstName} ${review.reviewerId.lastName}`}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {review.reviewerId.firstName[0]}{review.reviewerId.lastName[0]}
                  </span>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium">
                    {review.reviewerId.firstName} {review.reviewerId.lastName}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {review.skillId.skillTitle}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-gray-700">{review.comment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
