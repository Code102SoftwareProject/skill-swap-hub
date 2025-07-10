'use client';

import React from 'react';
import Image from 'next/image';
import { SkillMatch } from '@/types/skillMatch';
import { BadgeCheck, ArrowRightLeft, Eye } from 'lucide-react';

interface MatchCardProps {
  match: SkillMatch;
  onClick: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Match Percentage Banner */}
      <div 
        className={`h-2 ${match.matchPercentage === 100 ? 'bg-blue-500' : 'bg-blue-300'}`} 
        style={{ width: `${match.matchPercentage}%` }}
      />
      
      {/* Card Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span 
              className={`px-2 py-1 text-xs rounded-full font-medium ${
                match.matchPercentage === 100 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {match.matchPercentage}% Match
            </span>
            
            <span 
              className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(match.status)}`}
            >
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </span>
          </div>
          
          <span className="text-xs text-gray-500">
            {formatDate(match.createdAt)}
          </span>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-4">
        {/* Users and Skills */}
        <div className="flex items-center justify-between mb-4">
          {/* Your skills */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 mx-auto mb-2 flex items-center justify-center">
              <span className="text-blue-500 font-bold">You</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {match.myDetails.offeringSkill}
            </p>
            <p className="text-xs text-gray-500">Offering</p>
          </div>
          
          {/* Exchange arrows */}
          <div className="flex-1 px-2">
            <ArrowRightLeft className="w-6 h-6 mx-auto text-blue-500" />
          </div>
          
          {/* Other user */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mx-auto mb-2">
              {match.otherUser.avatar ? (
                <Image
                  src={match.otherUser.avatar}
                  alt={`${match.otherUser.firstName} ${match.otherUser.lastName}`}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-blue-500 font-bold">
                    {match.otherUser.firstName.charAt(0)}
                    {match.otherUser.lastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {match.otherUser.offeringSkill}
            </p>
            <p className="text-xs text-gray-500">Offering</p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="mt-4 text-center">
          <h3 className="font-medium text-gray-800 flex items-center justify-center">
            {match.otherUser.firstName} {match.otherUser.lastName}
            <BadgeCheck className="w-4 h-4 ml-1 text-blue-500" />
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {match.matchPercentage === 100 
              ? "Perfect match! You're seeking exactly what they're offering."
              : "Partial match! They have the skill you're seeking in their skill set."}
          </p>
        </div>
      </div>
      
      {/* Card Footer */}
      <div className="bg-gray-50 px-4 py-3 text-right">
        <button
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </button>
      </div>
    </div>
  );
};

export default MatchCard;