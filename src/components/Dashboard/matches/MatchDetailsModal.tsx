'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SkillMatch } from '@/types/skillMatch';
import { useToast } from '@/lib/context/ToastContext';
import { updateMatchStatus, acceptMatchAndCreateChatRoom } from '@/services/matchService';
import { BadgeCheck, ArrowRight, MessageCircle, Calendar, XCircle, CheckCircle, Clock } from 'lucide-react';

interface MatchDetailsModalProps {
  match: SkillMatch;
  currentUserId: string;
  onClose: () => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  type?: 'accept' | 'reject';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
  type = 'accept'
}) => {
  if (!isOpen) return null;

  const confirmButtonClass = type === 'accept' 
    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 
                       focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 
                       focus:ring-offset-2 disabled:opacity-50 ${confirmButtonClass}`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, currentUserId, onClose }) => {
  const { showToast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showAcceptConfirmation, setShowAcceptConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Handle match acceptance with chat room creation
  const handleAcceptMatch = async () => {
    setSubmitting(true);
    try {
      // Accept match and create chat room in one API call
      const response = await acceptMatchAndCreateChatRoom(match.id);
      
      if (response.success) {
        const wasExistingRoom = response.data?.chatRoomExists;
        const message = wasExistingRoom 
          ? 'Match accepted successfully! Using existing chat room.'
          : 'Match accepted successfully! Chat room created.';
        
        showToast(message, 'success');
        
        // Close modals
        setShowAcceptConfirmation(false);
        onClose();
        
        // Redirect to chat page after a short delay
        setTimeout(() => {
          router.push('/chat');
        }, 1000);
      } else {
        showToast(response.message || 'Failed to accept match and create chat room', 'error');
        setShowAcceptConfirmation(false);
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      showToast('Error accepting match', 'error');
      setShowAcceptConfirmation(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle match rejection
  const handleRejectMatch = async () => {
    setSubmitting(true);
    try {
      const response = await updateMatchStatus(match.id, 'rejected');
      
      if (response.success) {
        showToast('Match declined successfully', 'success');
        setShowRejectConfirmation(false);
        onClose();
      } else {
        showToast(response.message || 'Failed to decline match', 'error');
        setShowRejectConfirmation(false);
      }
    } catch (error) {
      console.error('Error declining match:', error);
      showToast('Error declining match', 'error');
      setShowRejectConfirmation(false);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Determine what actions are available based on match status
  const canAccept = match.status === 'pending';
  const canReject = match.status === 'pending' || match.status === 'accepted';
  const canComplete = match.status === 'accepted';
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {match.matchPercentage}% Match Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
          </div>
          
          {/* Modal Body */}
          <div className="p-6">
            {/* Status Badge */}
            <div className="mb-6 flex justify-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                match.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                match.status === 'accepted' ? 'bg-green-100 text-green-800' :
                match.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {match.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                {match.status === 'accepted' && <CheckCircle className="w-4 h-4 mr-1" />}
                {match.status === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
                {match.status === 'completed' && <BadgeCheck className="w-4 h-4 mr-1" />}
                {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
              </span>
            </div>
            
            {/* Match information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Your Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">You're Offering</h3>
                <div className="bg-white p-3 rounded mb-4 shadow-sm">
                  <h4 className="font-medium text-gray-800">
                    {match.myDetails.offeringSkill}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    You'll teach or provide this skill
                  </p>
                </div>
                
                <h3 className="font-semibold text-purple-800 mb-2">You're Seeking</h3>
                <div className="bg-white p-3 rounded shadow-sm">
                  <h4 className="font-medium text-gray-800">
                    {match.myDetails.seekingSkill}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    You want to learn this skill
                  </p>
                </div>
              </div>
              
              {/* Other User's Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
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
                
                <h3 className="font-semibold text-blue-800 mb-2">They're Offering</h3>
                <div className="bg-white p-3 rounded mb-4 shadow-sm">
                  <h4 className="font-medium text-gray-800">
                    {match.otherUser.offeringSkill}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {match.otherUser.firstName} will teach you this skill
                  </p>
                </div>
                
                <h3 className="font-semibold text-purple-800 mb-2">They're Seeking</h3>
                <div className="bg-white p-3 rounded shadow-sm">
                  <h4 className="font-medium text-gray-800">
                    {match.otherUser.seekingSkill}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {match.otherUser.firstName} wants to learn this skill
                  </p>
                </div>
              </div>
            </div>
            
            {/* Match Assessment */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Match Assessment</h3>
              <div className="flex items-center mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${match.matchPercentage === 100 ? 'bg-blue-600' : 'bg-blue-400'}`} 
                    style={{ width: `${match.matchPercentage}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">{match.matchPercentage}%</span>
              </div>
              
              <p className="text-sm text-gray-600">
                {match.matchPercentage === 100 
                  ? "Perfect match! You're looking for exactly what each other is offering. This is an ideal skill swap opportunity." 
                  : "Partial match! Although not a perfect two-way match, the skill you're seeking is in their skill set. You can still have a valuable exchange."}
              </p>
            </div>
            
            {/* Match Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Match Created</p>
                  <p className="font-medium text-gray-800">{formatDate(match.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <ArrowRight className="w-5 h-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Match Type</p>
                  <p className="font-medium text-gray-800 capitalize">{match.matchType}</p>
                </div>
              </div>
            </div>

            {/* Match Benefits Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
                What happens when you accept?
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• A private chat room will be created instantly</li>
                <li>• You can start coordinating your skill exchange</li>
                <li>• Schedule sessions and track your progress</li>
                <li>• Access meeting tools and file sharing</li>
              </ul>
            </div>
          </div>
          
          {/* Modal Footer Actions */}
          <div className="p-6 border-t border-gray-200 flex flex-wrap gap-3 justify-between">
            <div>
              {/* Reject Button */}
              {canReject && (
                <button
                  onClick={() => setShowRejectConfirmation(true)}
                  disabled={submitting}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 
                           focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 inline-block mr-1" />
                  Decline Match
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              {/* Contact Button - only show if accepted */}
              {match.status === 'accepted' && (
                <button
                  onClick={() => router.push('/chat')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                           focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <MessageCircle className="w-4 h-4 inline-block mr-1" />
                  Open Chat
                </button>
              )}
              
              {/* Accept Button */}
              {canAccept && (
                <button
                  onClick={() => setShowAcceptConfirmation(true)}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                >
                  <CheckCircle className="w-4 h-4 inline-block mr-1" />
                  Accept Match
                </button>
              )}
              
              {/* Complete Button */}
              {canComplete && (
                <button
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 
                           focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-purple-400"
                >
                  <BadgeCheck className="w-4 h-4 inline-block mr-1" />
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accept Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptConfirmation}
        title="Accept Skill Match"
        message={`Are you sure you want to accept this match with ${match.otherUser.firstName} ${match.otherUser.lastName}? This will create a private chat room where you can coordinate your skill exchange.`}
        confirmText="Yes, Accept Match"
        cancelText="Cancel"
        onConfirm={handleAcceptMatch}
        onCancel={() => setShowAcceptConfirmation(false)}
        isLoading={submitting}
        type="accept"
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectConfirmation}
        title="Decline Skill Match"
        message={`Are you sure you want to decline this match with ${match.otherUser.firstName} ${match.otherUser.lastName}? This action cannot be undone.`}
        confirmText="Yes, Decline"
        cancelText="Cancel"
        onConfirm={handleRejectMatch}
        onCancel={() => setShowRejectConfirmation(false)}
        isLoading={submitting}
        type="reject"
      />
    </>
  );
};

export default MatchDetailsModal;