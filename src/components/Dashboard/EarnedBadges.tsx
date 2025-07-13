'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Badge {
  id: string;
  icon: string; // emoji or image
  label: string;
}

interface Props {
  userId: string;
}

export default function EarnedBadges({ userId }: Props) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch('/api/badge');
        const data = await res.json();
        setBadges(data || []);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setBadges([]);
      }
    };

    fetchBadges();
  }, [userId]);

  const displayedBadges = badges.slice(0, 5);

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
            <div key={badge.id || idx} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-lg">
                {badge.icon}
              </div>
              <span className="text-xs text-center">{badge.label}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No badges earned yet.</p>
        )}
      </div>
    </div>
  );
}
