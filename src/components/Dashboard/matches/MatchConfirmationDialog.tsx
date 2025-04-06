'use client';

import React from 'react';
import Image from 'next/image';
import { SkillMatch } from '@/types/skillMatch';
import { BadgeCheck } from 'lucide-react';

interface MatchConfirmationDialogProps {
  match: SkillMatch;
  onCancel: () => void;
  onContinue: () => void;
}

const MatchConfirmationDialog: React.FC<MatchConfirmationDialogProps> = ({ 
  match, 
  onCancel, 
  onContinue 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* User 1 Details */}
          <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-blue-500 font-bold">
                    {match.myDetails.firstName.charAt(0)}
                    {match.myDetails.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 flex items-center">
                  {match.myDetails.firstName} {match.myDetails.lastName}
                  <BadgeCheck className="w-4 h-4 ml-1 text-blue-500" />
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-800">Offering</h4>
                <p className="mt-1">{match.myDetails.offeringSkill}</p>
              </div>
            </div>
            
            <div>
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-800">Seeking</h4>
                <p className="mt-1">{match.myDetails.seekingSkill}</p>
              </div>
            </div>
          </div>
          
          {/* Handshake Icon */}
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <span role="img" aria-label="handshake" className="text-2xl">🤝</span>
            </div>
          </div>
          
          {/* User 2 Details */}
          <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
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
              <div>
                <h3 className="font-medium text-gray-800 flex items-center">
                  {match.otherUser.firstName} {match.otherUser.lastName}
                  <BadgeCheck className="w-4 h-4 ml-1 text-blue-500" />
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-800">Offering</h4>
                <p className="mt-1">{match.otherUser.offeringSkill}</p>
              </div>
            </div>
            
            <div>
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-800">Seeking</h4>
                <p className="mt-1">{match.otherUser.seekingSkill}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom description and buttons */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">
            You have a {match.matchPercentage}% match with {match.otherUser.firstName}!
            {match.matchPercentage === 100 
              ? " This is a perfect match where both users can help each other learn their desired skills."
              : " This is a partial match. One of you can offer what the other is seeking, but not vice versa."}
          </p>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onContinue}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchConfirmationDialog;