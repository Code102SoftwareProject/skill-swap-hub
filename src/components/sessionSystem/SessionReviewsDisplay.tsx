'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, User } from 'lucide-react';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerId: { _id: string; firstName: string; lastName: string; avatar?: string };
  revieweeId: { _id: string; firstName: string; lastName: string; avatar?: string };
  skillId: { _id: string; skillTitle: string };
  reviewType: string;
}

interface SessionReviewsDisplayProps {
  sessionId?: string;
  userId?: string;
  skillId?: string;
  className?: string;
}

export default function SessionReviewsDisplay({ 
  sessionId, 
  userId, 
  skillId, 
  className = '' 
}: SessionReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [sessionId, userId, skillId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (userId) params.append('userId', userId);
      if (skillId) params.append('skillId', skillId);

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Average Rating Summary */}
      {averageRating && reviews.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-blue-600">
                {averageRating.toFixed(1)}
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  {renderStars(Math.round(averageRating))}
                </div>
                <div className="text-sm text-gray-600">
                  Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      {reviews.map((review) => (
        <Card key={review._id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {review.reviewerId.avatar ? (
                  <img
                    src={review.reviewerId.avatar}
                    alt={`${review.reviewerId.firstName} ${review.reviewerId.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {review.reviewerId.firstName} {review.reviewerId.lastName}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {review.skillId.skillTitle}
                  </span>
                </div>
                
                {/* Rating and Date */}
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                
                {/* Comment */}
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                
                {/* Review Type Badge */}
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {review.reviewType === 'skill_teaching' ? 'Teaching' : 'Learning'} Review
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
