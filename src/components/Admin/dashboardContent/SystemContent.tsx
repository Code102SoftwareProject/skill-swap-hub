'use client';

import BadgeManager from './BadgeManager';
import SkillList from '@/components/Admin/skillList';
import ForumManagement from '../ForumManagement';

export default function SystemContent() {
  return (
    <div className="p-6">
      {/* Other parts of System Configuration */}

      {/* 🔥 Badge Manager Part */}
      <div className="mt-10">
        <BadgeManager />
      </div>
      <div>
       
        <SkillList />
      </div>
      <div>
        <ForumManagement />
      </div>

      {/* Other sections */}
    </div>
  );
}

  