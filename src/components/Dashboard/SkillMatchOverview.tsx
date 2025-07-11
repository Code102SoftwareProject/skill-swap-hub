'use client';

import React, { useEffect, useState } from 'react';
import { findMatches, getMatches } from '@/services/matchService';
import { SkillMatch } from '@/types/skillMatch';
import { Users, Search, Zap } from 'lucide-react';

interface Props {
  onViewAll: () => void;
}

export default function SkillMatchOverview({ onViewAll }: Props) {
  const [exactMatches, setExactMatches] = useState<SkillMatch[]>([]);
  const [partialMatches, setPartialMatches] = useState<SkillMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const exactRes = await getMatches('exact');
        const partialRes = await getMatches('partial');

        if (exactRes.success) setExactMatches(exactRes.data ?? []);
        if (partialRes.success) setPartialMatches(partialRes.data ?? []);
      } catch (error) {
        console.error('Error fetching match overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="bg-white ">
      

      {loading ? (
        <div className="text-center py-6 text-gray-500">Loading matches...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <Zap className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-700">Exact Matches</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {exactMatches.length}
            </p>
            <p className="text-sm text-blue-600">Skills that match exactly</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center mb-2">
              <Search className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-medium text-purple-700">Partial Matches</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {partialMatches.length}
            </p>
            <p className="text-sm text-purple-600">Close or related skill matches</p>
          </div>
        </div>
      )}
    </div>
  );
}
