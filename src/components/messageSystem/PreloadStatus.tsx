import React from 'react';

interface PreloadStatusProps {
  isPreloading: boolean;
  preloadedCount: number;
  totalRooms: number;
}

export default function PreloadStatus({ isPreloading, preloadedCount, totalRooms }: PreloadStatusProps) {
  if (!isPreloading && preloadedCount === 0) return null;

  return (
    <div className="text-xs text-gray-500 p-2 border-b">
      {isPreloading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
          <span>Loading messages in background... ({preloadedCount}/{totalRooms})</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>All messages loaded ({preloadedCount} chats)</span>
        </div>
      )}
    </div>
  );
}
