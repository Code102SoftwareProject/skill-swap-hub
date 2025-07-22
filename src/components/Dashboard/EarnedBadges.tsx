'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { processAvatarUrl } from '@/utils/imageUtils';
import Image from 'next/image';

interface Badge {
  _id: string;
  badgeImage: string;
  badgeName: string;
  // Add other badge properties you need
}

interface Props {
  userId: string;
}

export default function EarnedBadges({ userId }: Props) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/badge-assignments/${userId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch badges');
        }
        
        const data = await res.json();
        
        // Transform API response to match your Badge interface
        const transformedBadges = data
          .filter((assignment: any) => assignment.badge) // Only keep assignments with a populated badge
          .map((assignment: any) => ({
            _id: assignment.badge.id,
            badgeImage: assignment.badge.badgeImage, // use badgeImage from schema
            badgeName: assignment.badge.badgeName // use badgeName from schema
          }));
        
        setBadges(transformedBadges);
        setError(null);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to load badges');
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  const displayedBadges = badges.slice(0, 5);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading badges...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="relative">
      {/* Learn More Button - top right */}
      <div className="absolute right-0 -top-2">
        <button
          onClick={() => router.push('/badge')}
          className="text-sm text-blue-600 hover:underline"
        >
          Learn More →
        </button>
      </div>

      {/* Badge Display */}
      <div className="flex flex-wrap gap-6 pt-6">
        {displayedBadges.length > 0 ? (
          displayedBadges.map((badge, idx) => (
            <div key={badge._id || idx} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-lg overflow-hidden">
                {badge.badgeImage ? (
                  <Image
                    src={processAvatarUrl(badge.badgeImage) || '/placeholder-badge.png'}
                    alt={badge.badgeName}
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <span className="text-gray-400">?</span>
                )}
              </div>
              <span className="text-xs text-center">{badge.badgeName}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No badges earned yet.</p>
        )}
      </div>
    </div>
  );
}