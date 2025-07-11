'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import PersonalizedFeed from './PersonalizedFeed';
import PublicForumFeed from './PublicForumFeed';

interface UnifiedForumFeedProps {
  className?: string;
  forumId?: string;
}

const UnifiedForumFeed: React.FC<UnifiedForumFeedProps> = ({ className = '', forumId }) => {
  const { user } = useAuth();

  // Show personalized feed for logged-in users, public feed for others
  if (user) {
    return <PersonalizedFeed className={className} />;
  } else {
    return <PublicForumFeed className={className} forumId={forumId} />;
  }
};

export default UnifiedForumFeed;
