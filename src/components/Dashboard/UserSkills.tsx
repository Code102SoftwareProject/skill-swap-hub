'use client';

import React, { useEffect, useState } from 'react';
import { getUserSkills } from '@/services/skillService';
import { getSkillsUsedInMatches } from '@/services/trendingService';
import { UserSkill } from '@/types/userSkill';
import { Calendar, Users } from 'lucide-react';

interface SkillsOverviewProps {
  onViewMore: () => void;
}

export default function SkillsOverview({ onViewMore }: SkillsOverviewProps) {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [usedSkillIds, setUsedSkillIds] = useState<string[]>([]);
  const [matchUsedSkills, setMatchUsedSkills] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const skillsRes = await getUserSkills();
        const listingUsedRes = await fetch('/api/myskills/used-in-listings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        const matchRes = await getSkillsUsedInMatches();

        const listingData = await listingUsedRes.json();

        if (skillsRes.success && skillsRes.data) {
          setSkills(skillsRes.data.slice(0, 6)); // show 6 skills in grid
        }
        if (listingData.success && listingData.data) {
          setUsedSkillIds(listingData.data);
        }
        if (matchRes.success && matchRes.data) {
          setMatchUsedSkills(matchRes.data);
        }
      } catch (err) {
        console.error('Error loading skills overview:', err);
      }
    };

    fetchData();
  }, []);

  const isSkillUsedInListing = (skillId: string) => {
    return usedSkillIds.includes(skillId);
  };

  const isSkillUsedInMatches = (skillId: string) => {
    return matchUsedSkills?.usedSkillIds?.includes(skillId) || false;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">My Skills</h3>
        <button
          onClick={onViewMore}
          className="text-sm text-blue-600 hover:underline"
        >
          View More →
        </button>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-gray-500">No skills added yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`border rounded-lg p-3 flex flex-col items-center text-center ${
                isSkillUsedInListing(skill.id)
                  ? 'border-blue-400 bg-blue-50'
                  : isSkillUsedInMatches(skill.id)
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="w-full flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  skill.proficiencyLevel === 'Expert' ? 'bg-blue-100 text-blue-800' :
                  skill.proficiencyLevel === 'Intermediate' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {skill.proficiencyLevel.charAt(0)}
                </span>
                
                {(isSkillUsedInListing(skill.id) || isSkillUsedInMatches(skill.id)) && (
                  <div className="flex gap-1">
                    {isSkillUsedInListing(skill.id) && (
                      <Calendar className="w-3 h-3 text-blue-600" />
                    )}
                    {isSkillUsedInMatches(skill.id) && (
                      <Users className="w-3 h-3 text-purple-600" />
                    )}
                  </div>
                )}
              </div>

              <h4 className="text-sm font-medium text-gray-800 line-clamp-2">
                {skill.skillTitle}
              </h4>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}