// components/User/DashboardContent/ReviewsContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { ReviewCard } from './ReviewCard';

export default function ReviewsContent() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    averageRating: null as number | null,
    totalReviews: 0
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        let url = `/api/reviews/${user._id}?page=${page}&limit=${limit}`;
        if (ratingFilter) url += `&rating=${ratingFilter}`;
        if (dateFilter) url += `&sort=${dateFilter}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
          setReviews(data.reviews);
          setStats({
            averageRating: data.averageRating,
            totalReviews: data.totalReviews
          });
        } else {
          setError(data.error || 'Failed to fetch reviews');
        }
      } catch (err) {
        setError('An error occurred while fetching reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user?._id, page, limit, ratingFilter, dateFilter, search]);

  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setPage(p => p + 1);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6">
      <div className="bg-white rounded-xl shadow p-4 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">All Reviews</h1>
          {stats.averageRating !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-800">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-2xl text-yellow-400">★</span>
              <span className="text-gray-500">
                ({stats.totalReviews} reviews)
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 text-gray-700">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reviews..."
            className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={r}>
                {r} ★
              </option>
            ))}
          </select>
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 w-full bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className={`px-6 py-2 rounded-md border text-base font-semibold ${page === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(stats.totalReviews / limit)}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page * limit >= stats.totalReviews}
                className={`px-6 py-2 rounded-md border text-base font-semibold ${page * limit >= stats.totalReviews ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-500">No reviews found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}