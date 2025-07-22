'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SkillMatch } from '@/types/skillMatch';
import { BadgeCheck, ArrowRightLeft, Eye, MessageCircle, Clock, CheckCircle, XCircle, Award, Calendar, AlertCircle } from 'lucide-react';
import { processAvatarUrl } from '@/utils/avatarUtils';

interface MatchCardProps {
  match: SkillMatch;
  onClick: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
  const [otherUserKycStatus, setOtherUserKycStatus] = useState<string | null>(null);

  // Fetch KYC status for the other user
  useEffect(() => {
    async function fetchKycStatus() {
      try {
        const res = await fetch(`/api/kyc/status?userId=${match.otherUser.userId}`);
        const data = await res.json();
        setOtherUserKycStatus(data.success ? data.status : null);
      } catch (err) {
        setOtherUserKycStatus(null);
      }
    }
    if (match.otherUser.userId) {
      fetchKycStatus();
    }
  }, [match.otherUser.userId]);

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Status badge color and icon
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Awaiting Response' };
      case 'accepted':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Active Match' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Declined' };
      case 'completed':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Award, text: 'Completed' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock, text: 'Unknown' };
    }
  };
  
  const statusConfig = getStatusConfig(match.status);
  const StatusIcon = statusConfig.icon;
  
  // Process avatar URLs with fallbacks
  const otherUserAvatar = processAvatarUrl(match.otherUser.avatar) || '/Avatar.png';
  const myAvatar = processAvatarUrl(match.myDetails.avatar) || '/Avatar.png';

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm overflow-hidden border hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.02] h-auto min-h-[280px] flex flex-col ${
        match.status === 'accepted' ? 'border-l-4 border-l-green-500 border-gray-200' :
        match.status === 'pending' ? 'border-l-4 border-l-yellow-500 border-gray-200' :
        match.status === 'completed' ? 'border-l-4 border-l-blue-500 border-gray-200' :
        'border-gray-200'
      }`}
      onClick={onClick}
    >
      {/* Match Percentage Banner */}
      <div className="h-2 bg-gray-200 relative overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${
            match.matchPercentage === 100 ? 'bg-gradient-to-r from-blue-500 to-green-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'
          }`} 
          style={{ width: `${match.matchPercentage}%` }}
        />
        {match.matchPercentage === 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>
      
      {/* Card Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${
                match.matchPercentage === 100 
                  ? 'bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 border border-blue-200' 
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {match.matchPercentage}% {match.matchType === 'exact' ? '🎯' : '🔄'}
            </span>
          </div>
          
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(match.createdAt)}
            </span>
          </div>
        </div>
        
        {/* Enhanced Status Badge */}
        <div className="flex items-center justify-center mt-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.text}
          </span>
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        {/* Users and Skills */}
        <div className="flex items-start justify-between mb-3 gap-2">
          {/* Your skills */}
          <div className="text-center flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mx-auto mb-2">
              <Image
                src={myAvatar}
                alt="Your avatar"
                width={40}
                height={40}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Fallback to "You" text if image fails to load
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    canvas.width = 40;
                    canvas.height = 40;
                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(0, 0, 40, 40);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('You', 20, 20);
                    target.src = canvas.toDataURL();
                  } else {
                    target.src = '/Avatar.png';
                  }
                  target.onerror = null;
                }}
              />
            </div>
            <div className="space-y-1">
              <p 
                className="text-sm font-semibold text-gray-800 truncate max-w-full" 
                title={match.myDetails.offeringSkill}
                style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.2em',
                  maxHeight: '2.4em'
                }}
              >
                {match.myDetails.offeringSkill}
              </p>
              <p className="text-xs text-green-600 font-medium">You Offer</p>
            </div>
          </div>
          
          {/* Exchange arrows */}
          <div className="flex items-center justify-center px-1 py-2">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-full p-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          
          {/* Other user */}
          <div className="text-center flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mx-auto mb-2">
              <Image
                src={otherUserAvatar}
                alt={`${match.otherUser.firstName} ${match.otherUser.lastName}`}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Fallback to initials if image fails to load
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    canvas.width = 40;
                    canvas.height = 40;
                    ctx.fillStyle = '#c084fc';
                    ctx.fillRect(0, 0, 40, 40);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const initials = `${match.otherUser.firstName.charAt(0)}${match.otherUser.lastName.charAt(0)}`;
                    ctx.fillText(initials, 20, 20);
                    target.src = canvas.toDataURL();
                  } else {
                    target.src = '/Avatar.png';
                  }
                  target.onerror = null;
                }}
              />
            </div>
            <div className="space-y-1">
              <p 
                className="text-sm font-semibold text-gray-800 truncate max-w-full" 
                title={match.otherUser.offeringSkill}
                style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.2em',
                  maxHeight: '2.4em'
                }}
              >
                {match.otherUser.offeringSkill}
              </p>
              <p className="text-xs text-purple-600 font-medium">They Offer</p>
            </div>
          </div>
        </div>
        
        {/* User Info */}
        <div className="mt-3 text-center space-y-2">
          <div className="flex items-center justify-center max-w-full">
            <h3 className="font-medium text-gray-800 flex items-center min-w-0">
              <span 
                className="truncate" 
                title={`${match.otherUser.firstName} ${match.otherUser.lastName}`}
                style={{ maxWidth: '150px' }}
              >
                {match.otherUser.firstName} {match.otherUser.lastName}
              </span>
              {(otherUserKycStatus === 'Accepted' || otherUserKycStatus === 'Approved') ? (
                <BadgeCheck className="w-4 h-4 ml-1 text-blue-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 ml-1 text-orange-500 flex-shrink-0" aria-label="Not Verified" />
              )}
            </h3>
          </div>
          
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-2">
            <p className="text-xs text-gray-700 leading-relaxed text-center">
              {match.matchPercentage === 100 
                ? "🎯 Perfect match! Mutual skill exchange opportunity."
                : "🔄 Partial match! They can teach you what you're seeking."}
            </p>
          </div>
          
          {/* Success indicators */}
          {match.status === 'accepted' && (
            <div className="inline-flex items-center text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat available
            </div>
          )}
        </div>
      </div>
      
      {/* Card Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Quick action based on status */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-600 font-medium truncate">
              {match.status === 'pending' && '⏳ Awaiting your response'}
              {match.status === 'accepted' && '🚀 Ready to collaborate'}
              {match.status === 'completed' && '✅ Successfully completed'}
              {match.status === 'rejected' && '❌ Match declined'}
            </div>
          </div>
          
          <button
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-all duration-200 hover:bg-blue-50 px-2 py-1 rounded flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">
              {match.status === 'accepted' ? 'Manage' : 'View Details'}
            </span>
            <span className="sm:hidden">View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;