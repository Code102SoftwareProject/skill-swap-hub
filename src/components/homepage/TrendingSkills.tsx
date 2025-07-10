// File: src/components/homepage/TrendingSkills.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Star, Clock, ArrowRight } from 'lucide-react';
import { getTrendingSkills, TrendingSkill } from '@/services/trendingService';

const TrendingSkills: React.FC = () => {
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const fetchTrendingSkills = async () => {
      setLoading(true);
      try {
        const response = await getTrendingSkills(8); // Get top 8 trending skills
        
        if (response.success && response.data) {
          setTrendingSkills(response.data);
          setTotalMatches(response.meta?.totalMatches || 0);
          setLastUpdated(response.meta?.generatedAt || '');
          setError(null);
        } else {
          setError(response.message || 'Failed to load trending skills');
        }
      } catch (err) {
        console.error('Error fetching trending skills:', err);
        setError('Failed to load trending skills');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingSkills();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get trend color based on match count
  const getTrendColor = (matchCount: number, index: number) => {
    if (index === 0) return 'text-yellow-300'; // Gold for #1
    if (index <= 2) return 'text-cyan-300';    // Cyan for top 3
    if (matchCount >= 10) return 'text-blue-200'; // Light blue for high activity
    return 'text-blue-300'; // Blue for others
  };

  // Get trend icon based on position
  const getTrendIcon = (index: number, matchCount: number) => {
    if (index === 0) return <Star className="w-4 h-4 text-yellow-300" fill="currentColor" />;
    if (matchCount >= 15) return <TrendingUp className="w-4 h-4 text-cyan-300" />;
    return <Users className="w-4 h-4 text-blue-300" />;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-blue-800 to-[#006699] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 text-cyan-300 opacity-20 text-2xl">+</div>
          <div className="absolute top-32 right-32 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute top-48 left-48 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute top-24 right-64 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute top-80 right-16 text-cyan-300 opacity-20 text-lg">+</div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-white/20 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/20 rounded-lg h-32"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || trendingSkills.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-b from-blue-800 to-[#006699] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 text-cyan-300 opacity-20 text-2xl">+</div>
          <div className="absolute top-32 right-32 text-cyan-300 opacity-20 text-lg">+</div>
          <div className="absolute top-48 left-48 text-cyan-300 opacity-20 text-lg">+</div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">Trending Skills</h2>
          <p className="text-blue-100 mb-8">
            {error || 'No trending skills data available yet. Start creating matches to see trending skills!'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-blue-800 to-[#006699] relative overflow-hidden">
      {/* Decorative background elements matching hero section */}
      <div className="absolute inset-0">
        <div className="absolute top-16 left-16 text-cyan-300 opacity-20 text-2xl">+</div>
        <div className="absolute top-32 right-32 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-48 left-48 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-24 right-64 text-cyan-300 opacity-20 text-lg">+</div>
        <div className="absolute top-80 right-16 text-cyan-300 opacity-20 text-lg">+</div>
        
        {/* Flowing lines similar to hero */}
        <div className="absolute -right-20 top-1/4 w-96 h-96 bg-gradient-to-l from-cyan-400/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -left-20 bottom-1/3 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-300/20 text-cyan-100 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-cyan-300/30">
            <TrendingUp className="w-4 h-4" />
            Live from the SkillSwap Community
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🔥 Trending Skills
          </h2>
          <p className="text-lg text-blue-100 max-w-3xl mx-auto">
            Discover the most sought-after skills in our community! These skills are currently the most active in skill exchanges and matches.
          </p>
          
          {/* Stats */}
          {totalMatches > 0 && (
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-blue-200">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {totalMatches} total skill matches
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Updated {formatDate(lastUpdated)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trending Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {trendingSkills.map((skill, index) => (
            <div
              key={skill.skillName}
              className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all duration-300 group hover:bg-white/15 ${
                index === 0 ? 'ring-2 ring-yellow-300/50 bg-gradient-to-br from-yellow-400/10 to-white/10' :
                index <= 2 ? 'ring-1 ring-cyan-300/50 bg-gradient-to-br from-cyan-400/10 to-white/10' : 
                'border-white/20'
              }`}
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  index === 0 ? 'bg-yellow-300/20 text-yellow-200 border border-yellow-300/30' :
                  index <= 2 ? 'bg-cyan-300/20 text-cyan-200 border border-cyan-300/30' :
                  'bg-white/20 text-blue-200 border border-white/30'
                }`}>
                  #{index + 1}
                </div>
                {getTrendIcon(index, skill.matchCount)}
              </div>

              {/* Skill Name */}
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                {skill.skillName}
              </h3>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Matches</span>
                  <span className={`font-semibold ${getTrendColor(skill.matchCount, index)}`}>
                    {skill.matchCount}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Activity</span>
                  <span className="font-semibold text-cyan-300">
                    {skill.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-300 to-yellow-400' :
                      index <= 2 ? 'bg-gradient-to-r from-cyan-300 to-cyan-400' :
                      'bg-gradient-to-r from-blue-300 to-blue-400'
                    }`}
                    style={{ width: `${Math.min(parseFloat(skill.percentage) * 4, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Trend Score (hidden, for debugging) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-blue-300">
                  Score: {skill.trendScore}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-8 text-white border border-cyan-300/20">
            <h3 className="text-2xl font-bold mb-4">Ready to Join the Trend?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Add these trending skills to your profile or create listings to connect with other learners. 
              The more you participate, the better matches you'll get!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-cyan-300 text-[#006699] px-6 py-3 rounded-lg font-semibold hover:bg-cyan-200 transition-colors inline-flex items-center gap-2">
                Add My Skills
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="border border-cyan-300 text-cyan-300 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-300/10 transition-colors">
                Browse All Skills
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-blue-200">
          <p>
            Trending data is updated in real-time based on active skill matches and exchanges in our community.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrendingSkills;