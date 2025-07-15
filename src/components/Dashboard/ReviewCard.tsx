// Enhanced ReviewCard.tsx
import Image from 'next/image';
import { processAvatarUrl } from '@/utils/imageUtils';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: {
    name: string;
    avatar?: string;
  };
}

export function ReviewCard({ review }: { review: Review }) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const avatarUrl = review.reviewer?.avatar ? processAvatarUrl(review.reviewer.avatar) : undefined;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start">
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${review.reviewer.name || 'Anonymous'}'s avatar`}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full object-cover shadow"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow">
            {review.reviewer?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-gray-900">{review.reviewer?.name || 'Anonymous'}</span>
          <span className="text-xs text-gray-400 mt-1 sm:mt-0">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-2 text-sm text-gray-500">{review.rating}.0</span>
        </div>
        <p className="mt-3 text-gray-700 text-base">{review.comment}</p>
      </div>
    </div>
  );
}