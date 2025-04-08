'use client';

import { FC } from 'react';
import { UserCircle2 } from 'lucide-react';

type SkillItem = {
  id: number;
  skill: string;
  mentor: string;
  progress: number; // from 0 to 100
};

const skills: SkillItem[] = [
  { id: 1, skill: 'Game Development', mentor: 'Suresh', progress: 60 },
  { id: 2, skill: 'Web Development', mentor: 'Ani_tha', progress: 75 },
  { id: 3, skill: 'Counseling', mentor: 'Chris_Williams', progress: 40 },
];

const SkillProgress: FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border w-full max-w-sm p-4 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold mb-4">Completion progress</h2>
      <div className="space-y-4">
        {skills.map((item) => (
          <div
            key={item.id}
            className="bg-[#faf5f9] p-3 rounded-lg shadow-inner space-y-1"
          >
            <div className="font-semibold">{item.skill}</div>
            <div className="flex items-center text-sm text-gray-600">
              <UserCircle2 className="w-4 h-4 mr-1" />
              {item.mentor}
            </div>
            <div className="relative w-full h-2 mt-2 bg-indigo-100 rounded-full">
              <div
                className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillProgress;
