'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import ProfileCard from "@/components/Dashboard/ProfileCard";
import { SkillsRequested, SkillsOffered } from "@/components/Dashboard/SkillsRequested";
import { TimeSpent } from "@/components/Dashboard/TimeSpentChart";
import UserSkills from "@/components/Dashboard/UserSkills";
import EarnedBadges from "@/components/Dashboard/EarnedBadges";

export default function UserDashboardContent({ onNavigateToMySkills }: { onNavigateToMySkills: () => void })  {
  const { user } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'User';

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
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <ProfileCard userId={user._id} />
            </div>
          )}

          {/* Time Spent */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Time Spent</h3>
            <TimeSpent />
          </div>

          {/* Skill Matches */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Skill Matches</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center">
                <span>Python Programming Mentors</span>
                <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">14</span>
              </li>
              <li className="flex justify-between items-center">
                <span>JavaScript Debugging Help</span>
                <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">7</span>
              </li>
              <li className="flex justify-between items-center">
                <span>UI/UX Design Review Sessions</span>
                <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">26</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Java Training Sessions</span>
                <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold">3</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}