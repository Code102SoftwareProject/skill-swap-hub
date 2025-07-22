'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SkillMatch } from '@/types/skillMatch';
import { useToast } from '@/lib/context/ToastContext';
import { updateMatchStatus, acceptMatchAndCreateChatRoom } from '@/services/matchService';
import { fetchUserChatRooms } from '@/services/chatApiServices';
import { useAuth } from '@/lib/context/AuthContext';
import { BadgeCheck, ArrowRight, MessageCircle, Calendar, XCircle, CheckCircle, Clock, Award, BarChart3, Target, AlertCircle } from 'lucide-react';
import { processAvatarUrl } from '@/utils/avatarUtils';

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
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showAcceptConfirmation, setShowAcceptConfirmation] = useState(false);
  const [showRejectConfirmation, setShowRejectConfirmation] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
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
  
  // Get status display configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          color: 'bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-800 border-yellow-200', 
          icon: Clock, 
          text: 'Awaiting Response' 
        };
      case 'accepted':
        return { 
          color: 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200', 
          icon: CheckCircle, 
          text: 'Active Match' 
        };
      case 'rejected':
        return { 
          color: 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200', 
          icon: XCircle, 
          text: 'Declined' 
        };
      case 'completed':
        return { 
          color: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200', 
          icon: Award, 
          text: 'Completed' 
        };
      default:
        return { 
          color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200', 
          icon: Clock, 
          text: 'Unknown' 
        };
    }
  };
  
  const statusConfig = getStatusConfig(match.status);
  
  // Process avatar URLs with fallbacks
  const otherUserAvatar = processAvatarUrl(match.otherUser.avatar) || '/Avatar.png';
  const myAvatar = processAvatarUrl(match.myDetails.avatar) || '/Avatar.png';
  
  // Handle match acceptance with chat room creation
  const handleAcceptMatch = async () => {
    setSubmitting(true);
    try {
      // Accept match and create chat room in one API call
      const response = await acceptMatchAndCreateChatRoom(match.id);
      
      if (response.success) {
        const wasExistingRoom = response.data?.chatRoomExists;
        const chatRoomId = response.data?.chatRoomId || response.data?.chatRoom?._id;
        
        const message = wasExistingRoom 
          ? 'Match accepted successfully! Using existing chat room.'
          : 'Match accepted successfully! Chat room created.';
        
        showToast(message, 'success');
        
        // Close modals
        setShowAcceptConfirmation(false);
        onClose();
        
        // Redirect to chat page with the specific room ID after a short delay
        setTimeout(() => {
          if (chatRoomId) {
            router.push(`/user/chat?from=dashboard&roomId=${chatRoomId}`);
          } else {
            // Fallback: redirect without roomId and let user find the room manually
            router.push('/user/chat?from=dashboard');
          }
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

  // Handle opening chat room
  const handleOpenChat = async () => {
    if (!user?._id) {
      showToast('Authentication required to open chat', 'error');
      return;
    }

    setOpeningChat(true);
    try {
      // Get all user's chat rooms with a small retry mechanism for newly created rooms
      let chatRooms = await fetchUserChatRooms(user._id);
      
      // If no chat rooms found, wait a moment and try once more (in case room was just created)
      if (chatRooms.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        chatRooms = await fetchUserChatRooms(user._id);
      }
      
      if (chatRooms.length === 0) {
        showToast('No chat rooms found. The chat room may still be being created.', 'error');
        return;
      }

      // Find the chat room that includes the other user from this match
      const matchChatRoom = chatRooms.find(room => 
        room.participants && room.participants.includes(match.otherUser.userId)
      );

      if (matchChatRoom) {
        // Navigate to chat page with the specific room selected
        router.push(`/user/chat?from=dashboard&roomId=${matchChatRoom._id}`);
        onClose();
      } else {
        showToast('Chat room not found for this match. It may still be being created.', 'error');
        // Fallback: redirect to chat page without specific room
        setTimeout(() => {
          router.push('/user/chat?from=dashboard');
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error('Error opening chat room:', error);
      showToast('Error opening chat room', 'error');
    } finally {
      setOpeningChat(false);
    }
  };

  
  // Determine what actions are available based on match status
  const canAccept = match.status === 'pending';
  const canReject = match.status === 'pending'; // Only allow reject when pending
  const canOpenChat = match.status === 'accepted';
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Simple Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  match.matchPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {match.matchPercentage}%
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Match Details
                  </h2>
                  <p className="text-sm text-gray-600">
                    {match.matchType === 'exact' ? 'Perfect Match' : 'Partial Match'} • {formatDate(match.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
          </div>
          
          {/* Simple Modal Body */}
          <div className="p-6">
            {/* Simple Status Badge */}
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
                {statusConfig.text}
              </span>
            </div>
            
            {/* Match Information with Consistent Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Your Information */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
                    <Image
                      src={myAvatar}
                      alt="Your avatar"
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Fallback to "You" text if image fails to load
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          canvas.width = 48;
                          canvas.height = 48;
                          ctx.fillStyle = '#3b82f6';
                          ctx.fillRect(0, 0, 48, 48);
                          ctx.fillStyle = '#ffffff';
                          ctx.font = 'bold 16px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          ctx.fillText('You', 24, 24);
                          target.src = canvas.toDataURL();
                        } else {
                          target.src = '/Avatar.png';
                        }
                        target.onerror = null;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800">Your Profile</h3>
                    <p className="text-xs text-blue-600">Skills Exchange</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Offering</span>
                    <h4 className="font-semibold text-gray-800 mt-1">
                      {match.myDetails.offeringSkill}
                    </h4>
                    <p className="text-sm text-gray-600">
                      You'll teach this skill
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Seeking</span>
                    <h4 className="font-semibold text-gray-800 mt-1">
                      {match.myDetails.seekingSkill}
                    </h4>
                    <p className="text-sm text-gray-600">
                      You want to learn this skill
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Other User's Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3">
                    <Image
                      src={otherUserAvatar}
                      alt={`${match.otherUser.firstName} ${match.otherUser.lastName}`}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Create a canvas for initials fallback
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          canvas.width = 48;
                          canvas.height = 48;
                          ctx.fillStyle = '#c084fc';
                          ctx.fillRect(0, 0, 48, 48);
                          ctx.fillStyle = '#ffffff';
                          ctx.font = 'bold 18px Arial';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'middle';
                          const initials = `${match.otherUser.firstName.charAt(0)}${match.otherUser.lastName.charAt(0)}`;
                          ctx.fillText(initials, 24, 24);
                          target.src = canvas.toDataURL();
                        } else {
                          target.src = '/Avatar.png';
                        }
                        target.onerror = null;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      {match.otherUser.firstName} {match.otherUser.lastName}
                      {(otherUserKycStatus === 'Accepted' || otherUserKycStatus === 'Approved') ? (
                        <BadgeCheck className="w-4 h-4 ml-1 text-blue-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 ml-1 text-orange-500" aria-label="Not Verified" />
                      )}
                    </h3>
                    <p className="text-xs text-gray-600">Partner Profile</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <span className="text-xs font-medium text-green-600 uppercase tracking-wide">They Offer</span>
                    <h4 className="font-semibold text-gray-800 mt-1">
                      {match.otherUser.offeringSkill}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {match.otherUser.firstName} will teach you this
                    </p>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">They Seek</span>
                    <h4 className="font-semibold text-gray-800 mt-1">
                      {match.otherUser.seekingSkill}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {match.otherUser.firstName} wants to learn this
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Simple Match Assessment */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Match Assessment</h3>
              <div className="flex items-center mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${match.matchPercentage === 100 ? 'bg-green-600' : 'bg-blue-500'}`} 
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
            
            {/* Simple Match Details */}
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

            {/* Status-specific information */}
            {match.status === 'pending' && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
                  What happens when you accept?
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• A private chat room will be created instantly</li>
                  <li>• You'll be redirected to the chat page to start talking</li>
                  <li>• You can coordinate your skill exchange sessions</li>
                  <li>• Schedule meetings and track your progress together</li>
                  <li>• Access file sharing and collaboration tools</li>
                </ul>
              </div>
            )}
            
            {match.status === 'accepted' && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Active Match - Ready to Collaborate!
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Use the chat to coordinate your skill exchange</li>
                  <li>• Schedule learning sessions and share resources</li>
                  <li>• Track your progress and help each other</li>
                  <li>• Continue collaborating and learning together</li>
                </ul>
              </div>
            )}
            
            {match.status === 'completed' && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <Award className="w-5 h-5 text-purple-600 mr-2" />
                  Completed Match - Congratulations! 🎉
                </h3>
                <p className="text-sm text-gray-700">
                  This skill exchange has been successfully completed. You can still access the chat history 
                  and continue conversations with {match.otherUser.firstName}.
                </p>
              </div>
            )}
            
            {match.status === 'rejected' && (
              <div className="bg-gradient-to-r from-gray-50 to-red-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <XCircle className="w-5 h-5 text-gray-600 mr-2" />
                  Match Declined
                </h3>
                <p className="text-sm text-gray-700">
                  This match has been declined and is no longer active. You can find new matches 
                  by using the "Find New Matches" feature.
                </p>
              </div>
            )}
          </div>
          
          {/* Simple Modal Footer Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              {/* Left side - Destructive actions */}
              <div className="flex gap-3">
                {/* Reject Button - Only show for pending matches */}
                {canReject && (
                  <button
                    onClick={() => setShowRejectConfirmation(true)}
                    disabled={submitting}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 
                             focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4 inline-block mr-1" />
                    Decline Match
                  </button>
                )}
              </div>
              
              {/* Right side - Primary actions */}
              <div className="flex gap-3 sm:ml-auto">
                {/* Contact Button - show for accepted matches */}
                {canOpenChat && (
                  <button
                    onClick={handleOpenChat}
                    disabled={openingChat}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                             focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-400 transition-colors"
                  >
                    {openingChat ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Opening...</span>
                      </div>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 inline-block mr-1" />
                        Open Chat
                      </>
                    )}
                  </button>
                )}
                
                {/* Accept Button - only for pending */}
                {canAccept && (
                  <button
                    onClick={() => setShowAcceptConfirmation(true)}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 inline-block mr-1" />
                    Accept Match
                  </button>
                )}
              </div>
            </div>
            
            {/* Simple Status-specific help text */}
            <div className="mt-4 text-center">
              {match.status === 'pending' && (
                <p className="text-sm text-gray-600">
                  💡 <strong>Tip:</strong> Accept this match to start collaborating with {match.otherUser.firstName}!
                </p>
              )}
              {match.status === 'accepted' && (
                <p className="text-sm text-gray-600">
                  🚀 <strong>Active Match:</strong> Use chat to coordinate your skill exchange sessions.
                </p>
              )}
              {match.status === 'completed' && (
                <p className="text-sm text-gray-600">
                  ✅ <strong>Success:</strong> This skill exchange was completed successfully.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accept Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptConfirmation}
        title="Accept Skill Match"
        message={`Are you sure you want to accept this match with ${match.otherUser.firstName} ${match.otherUser.lastName}? This will create a private chat room where you can coordinate your skill exchange. You'll be redirected to the chat after acceptance.`}
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