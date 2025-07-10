'use client';

import React, { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/lib/context/AuthContext';

interface WatchPostButtonProps {
  postId: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onStatusChange?: () => void;
}

const WatchPostButton: React.FC<WatchPostButtonProps> = ({ 
  postId, 
  className = '', 
  showText = true,
  size = 'md',
  onStatusChange
}) => {
  const { user } = useAuth();
  const { isPostWatched, toggleWatchPost } = useUserPreferences();
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const isWatched = isPostWatched(postId);

  const handleToggleWatch = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    if (!user) {
      // Could show login prompt here
      return;
    }

    setIsLoading(true);
    
    try {
      const action = isWatched ? 'unwatch' : 'watch';
      await toggleWatchPost(postId, action);
      
      // Call the callback if provided
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error toggling watch status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    // Don't show the button at all if user is not logged in
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggleWatch}
        disabled={isLoading}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex items-center space-x-2 rounded-md font-medium transition-all duration-200
          ${isWatched 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${buttonSizes[size]}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
          ${className}
        `}
      >
        {isLoading ? (
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`} />
        ) : isWatched ? (
          <BookmarkCheck className={`${sizeClasses[size]} text-blue-600`} />
        ) : (
          <Bookmark className={sizeClasses[size]} />
        )}
        
        {showText && (
          <span>{isWatched ? 'Watching' : 'Watch'}</span>
        )}
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-50"
        >
          {isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800" />
        </motion.div>
      )}
    </div>
  );
};

export default WatchPostButton;
