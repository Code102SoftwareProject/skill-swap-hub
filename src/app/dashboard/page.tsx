'use client';

import React from 'react';
import { Edit2 } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

// Components
import SkillCard from "@/components/Dashboard/SkillCard";
import SkillsProgress from "@/components/Dashboard/SkillsProgress";
import RecentActivity from "@/components/Dashboard/RecentActivity";
import StatsChart from "@/components/Dashboard/StatsChart";
import ProfileCard from "@/components/Dashboard/ProfileCard";

// Skill data (Avoid hardcoding in JSX)
const skills = [
  {
    name: 'Mobile App Development',
    rating: '★ 4.5 (342)',
    color: 'red',
    abbreviation: 'M',
  },
  {
    name: 'Photography',
    rating: '★ 4.8 (127)',
    color: 'blue',
    abbreviation: 'P',
  },
  {
    name: 'Java',
    rating: '★ 4.2 (98)',
    color: 'green',
    abbreviation: 'J',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'User';

  return (
    <div className="container mx-auto text-gray-700">
      {/* Greeting Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Hi {fullName}, Welcome back!
        </h1>
      </div>

      {/* Skills Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Skills</h2>
          <button className="text-blue-600 hover:text-blue-800" aria-label="Edit Skills">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center mb-2">
                <div
                  className={`w-8 h-8 bg-${skill.color}-100 rounded-md flex items-center justify-center`}
                >
                  <span className={`text-${skill.color}-600 text-xs`}>
                    {skill.abbreviation}
                  </span>
                </div>
                <div className="ml-2">
                  <h3 className="text-sm font-medium">{skill.name}</h3>
                  <p className="text-xs text-gray-500">{skill.rating}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6 text-gray-600">
        {/* Left Column */}
        <div className="col-span-2">
          <div className="mt-6">
            <SkillsProgress />
          </div>
          <div className="mt-6">
            <RecentActivity />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-1 space-y-6">
          <ProfileCard />
          <StatsChart />
        </div>
      </div>
    </div>
  );
}
