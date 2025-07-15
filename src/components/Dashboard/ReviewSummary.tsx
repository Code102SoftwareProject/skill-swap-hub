// components/reviews/ReviewSummary.tsx
'use client';

import { useEffect, useState } from 'react';
import { ReviewCard } from './ReviewCard';

export function ReviewSummary({ userId, onViewAll }: { userId: string; onViewAll: () => void }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    averageRating: null as number | null,
    totalReviews: 0
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews/${userId}?summary=true`);
        const data = await res.json();
        if (res.ok) {
          setReviews(data.reviews);
          setStats({
            averageRating: data.averageRating,
            totalReviews: data.totalReviews
          });
          console.log('[ReviewSummary] totalReviews:', data.totalReviews);
        } else {
          setError(data.error || 'Failed to fetch reviews');
        }
      } catch (err) {
        setError('An error occurred while fetching reviews');
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchReviews();
  }, [userId]);

  if (error) return <div className="text-red-500 p-2">{error}</div>;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 ">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Reviews</h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 w-full bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div className="space-y-4">
            {reviews.slice(0, 3).map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
          {stats.totalReviews > 3 && (
            <button
              onClick={onViewAll}
              className="w-full mt-4 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition font-semibold"
            >
              View all {stats.totalReviews} reviews →
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p className="text-base">You don't have any reviews yet.</p>
        </div>
      )}
    </div>
  );
}
