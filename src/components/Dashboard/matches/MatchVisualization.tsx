'use client';

import React from 'react';
import Image from 'next/image';

interface UserInfo {
  firstName: string;
  lastName: string;
  avatar?: string;
  skillName: string;
}

interface MatchVisualizationProps {
  matchPercentage: number;
  user1: UserInfo;
  user2: UserInfo;
  onClick?: () => void;
}

const MatchVisualization: React.FC<MatchVisualizationProps> = ({ 
  matchPercentage, 
  user1, 
  user2,
  onClick
}) => {
  return (
    <div 
      className={`relative border border-gray-200 rounded-lg p-4 bg-white shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center">
        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${matchPercentage === 100 ? 'bg-blue-500' : 'bg-blue-400'}`}
            style={{ width: `${matchPercentage}%` }}
          />
        </div>
        <div className={`ml-2 px-2 py-1 text-xs font-bold rounded-full text-white ${
          matchPercentage === 100 ? 'bg-blue-500' : 'bg-blue-400'
        }`}>
          {matchPercentage}%
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between relative">
        {/* User 1 (Left) */}
        <div className="text-center">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 mx-auto">
            {user1.avatar ? (
              <Image 
                src={user1.avatar} 
                alt={`${user1.firstName} ${user1.lastName}`} 
                width={64} 
                height={64} 
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                <span className="text-blue-500 font-bold">
                  {user1.firstName.charAt(0)}
                  {user1.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 font-medium text-red-500">{user1.skillName}</p>
        </div>

        {/* Exchange Arrows */}
        <div className="flex-1 relative">
          {/* Top curved arrow (User1 → User2) */}
          <svg className="absolute w-full h-20 top-[-10px]" viewBox="0 0 100 40" fill="none">
            <path
              d="M10,20 C30,0 70,0 90,20"
              stroke="#0096FF"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M85,15 L90,20 L85,25"
              stroke="#0096FF"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Bottom curved arrow (User2 → User1) */}
          <svg className="absolute w-full h-20 bottom-[-10px]" viewBox="0 0 100 40" fill="none">
            <path
              d="M90,20 C70,40 30,40 10,20"
              stroke="#0096FF"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M15,15 L10,20 L15,25"
              stroke="#0096FF"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* User 2 (Right) */}
        <div className="text-center">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 mx-auto">
            {user2.avatar ? (
              <Image 
                src={user2.avatar} 
                alt={`${user2.firstName} ${user2.lastName}`}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                <span className="text-blue-500 font-bold">
                  {user2.firstName.charAt(0)}
                  {user2.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 font-medium text-red-500">{user2.skillName}</p>
        </div>
      </div>

      {/* View More Button */}
      {onClick && (
        <div className="mt-4 text-center">
          <button 
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View more →
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchVisualization;