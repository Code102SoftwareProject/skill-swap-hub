'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import ProfileCard from "@/components/Dashboard/ProfileCard";
import { SkillsRequested, SkillsOffered } from "@/components/Dashboard/SkillsRequested";
import { TimeSpentChart } from "@/components/Dashboard/TimeSpentChart";
import UserSkills from "@/components/Dashboard/UserSkills";
import EarnedBadges from "@/components/Dashboard/EarnedBadges";
import SkillMatchOverview from "@/components/Dashboard/SkillMatchOverview";
import { useSessionTimer } from '@/lib/hooks/useSessionTimer';
import { ReviewSummary } from '@/components/Dashboard/ReviewSummary';

interface UserDashboardContentProps {
  onNavigateToMySkills: () => void;
  onNavigateToReviews: () => void;
}

export default function UserDashboardContent({ 
  onNavigateToMySkills, 
  onNavigateToReviews 
}: UserDashboardContentProps) {
  const { user } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'User';
  useSessionTimer(user?._id ?? null);

  return (
    <div className="container mx-auto px-4 py-6 text-gray-700">
      {/* Greeting Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Hi {fullName}, Welcome back!
        </h1>
      </div>

      {/* Skills Section - Top Card */}
      <div className="mb-8">
        <UserSkills onViewMore={onNavigateToMySkills} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Skills Requested */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Skills Requested</h3>
            <SkillsRequested />
          </div>

          {/* Skills Offered */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Skills Offered</h3>
            <SkillsOffered />
          </div>

           {/* Reviews Section - Added to main column */}
          {user && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <ReviewSummary 
                userId={user._id} 
                onViewAll={onNavigateToReviews}
              />
            </div>
          )}

          {/* Badges */}
          {user && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Badges</h3>
              <EarnedBadges userId={user._id} />
            </div>
          )}
        </div>

        {/* Right/Sidebar Column */}
        <div className="lg:col-span-1 space-y-8">
          {/* Profile Card */}
          {user && (
            <ProfileCard userId={user._id} />
          )}

          {/* Time Spent */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Time Spent</h3>
            {user && <TimeSpentChart userId={user._id} />}
          </div>

          {/* Skill Matches */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Skill Matches</h3>
            <SkillMatchOverview onViewAll={() => { /* TODO: Implement navigation to matches or handle as needed */ }} />
          </div>
        </div>
      </div>
    </div>
  );
}