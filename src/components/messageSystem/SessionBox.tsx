"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Edit, Calendar, User, BookOpen, Trash2, Eye, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateSessionModal from '@/components/sessionSystem/CreateSessionModal';
import EditSessionModal from '@/components/sessionSystem/EditSessionModal';
import CounterOfferModal from '@/components/sessionSystem/CounterOfferModal';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import { processAvatarUrl } from '@/utils/avatarUtils';

// Type imports
import type { 
  Session, 
  CounterOffer, 
  UserProfile, 
  AlertState, 
  ConfirmationState 
} from '@/types';

interface SessionBoxProps {
  chatRoomId: string;
  userId: string;
  otherUserId: string;
  onSessionUpdate?: () => void; // Callback to notify parent about session changes
}

export default function SessionBox({ chatRoomId, userId, otherUserId, onSessionUpdate }: SessionBoxProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [counterOffers, setCounterOffers] = useState<{ [sessionId: string]: CounterOffer[] }>({});
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [sessionToCounterOffer, setSessionToCounterOffer] = useState<Session | null>(null);
  const [processingSession, setProcessingSession] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [sessionForRejection, setSessionForRejection] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sessionToRate, setSessionToRate] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showCancelledSessions, setShowCancelledSessions] = useState(false);
  const [pendingSessionCount, setPendingSessionCount] = useState(0);
  const [activeSessionCount, setActiveSessionCount] = useState(0);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [showActiveCounterOffers, setShowActiveCounterOffers] = useState<{[sessionId: string]: boolean}>({});

  // Alert and confirmation states
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Fetch other user's information
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        setUserLoading(true);
        const response = await fetch(`/api/users/${otherUserId}`);
        const data = await response.json();
        
        if (data.success) {
          setOtherUser(data.user);
        } else {
          console.error('Failed to fetch user:', data.message);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setUserLoading(false);
      }
    };

    if (otherUserId) {
      fetchOtherUser();
    }
  }, [otherUserId]);

  // Helper function to get user's display name
  const getUserDisplayName = (user: UserProfile | null): string => {
    if (!user) return 'Unknown User';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) return user.name;
    return user.email || 'Unknown User';
  };

  // Helper function to get display name from counter offer user
  const getCounterOfferUserName = (counterOfferedBy: any): string => {
    if (!counterOfferedBy) return 'Unknown User';
    
    // Handle if it's just an ID string
    if (typeof counterOfferedBy === 'string') {
      return 'Unknown User';
    }
    
    // Handle populated user object
    const firstName = counterOfferedBy.firstName?.trim();
    const lastName = counterOfferedBy.lastName?.trim();
    
    // Check if we have both firstName and lastName and they're not empty
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // If only one name is available, use it
    if (firstName) return firstName;
    if (lastName) return lastName;
    
    // Fallback to other fields
    if (counterOfferedBy.name?.trim()) {
      return counterOfferedBy.name.trim();
    }
    
    // If all else fails, use email but make it more user-friendly
    if (counterOfferedBy.email) {
      // Extract username part from email for better display
      const emailUsername = counterOfferedBy.email.split('@')[0];
      return emailUsername || counterOfferedBy.email;
    }
    
    return 'Unknown User';
  };

  // Helper functions for alerts and confirmations
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setAlert({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const showConfirmation = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'danger' | 'warning' | 'info' | 'success' = 'warning',
    confirmText?: string
  ) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      confirmText,
      loading: false
    });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const closeConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/session/between-users?user1Id=${userId}&user2Id=${otherUserId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched sessions:', data.sessions);
        setSessions(data.sessions);
        
        // Calculate pending session count (sessions created by current user that are still pending)
        const pendingCount = data.sessions.filter((session: Session) => 
          session.user1Id._id === userId && 
          session.status === 'pending' && 
          session.isAccepted === null
        ).length;
        setPendingSessionCount(pendingCount);
        
        // Calculate total active session count (pending + accepted) between both users
        const activeCount = data.sessions.filter((session: Session) => 
          session.status === 'pending' || session.status === 'active'
        ).length;
        setActiveSessionCount(activeCount);
        
        // Fetch counter offers for each session
        await fetchCounterOffers(data.sessions);
        
        // Notify parent component about session updates
        if (onSessionUpdate) {
          onSessionUpdate();
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, otherUserId, onSessionUpdate]);

  useEffect(() => {
    fetchSessions();
  }, [userId, fetchSessions]);

  const fetchCounterOffers = async (sessionList: Session[]) => {
    try {
      const counterOfferPromises = sessionList.map(async (session) => {
        const response = await fetch(`/api/session/counter-offer?sessionId=${session._id}`);
        const data = await response.json();
        return { sessionId: session._id, counterOffers: data.success ? data.counterOffers : [] };
      });

      const results = await Promise.all(counterOfferPromises);
      const counterOfferMap: { [sessionId: string]: CounterOffer[] } = {};
      
      results.forEach(({ sessionId, counterOffers: sessionCounterOffers }) => {
        counterOfferMap[sessionId] = sessionCounterOffers;
      });
      
      setCounterOffers(counterOfferMap);
    } catch (error) {
      console.error('Error fetching counter offers:', error);
    }
  };

  const handleAcceptReject = async (sessionId: string, action: 'accept' | 'reject') => {
    setProcessingSession(sessionId);
    try {
      const response = await fetch(`/api/session/${sessionId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh sessions to show updated status
        fetchSessions();
        showAlert('success', `Session ${action}ed successfully!`);
        
        // Invalidate cache for both users
        invalidateUsersCaches(userId, otherUserId);
      } else {
        showAlert('error', data.message || `Failed to ${action} session`);
      }
    } catch (error) {
      console.error(`Error ${action}ing session:`, error);
      showAlert('error', `Failed to ${action} session`);
    } finally {
      setProcessingSession(null);
    }
  };

  const handleCounterOffer = (sessionId: string) => {
    const session = sessions.find(s => s._id === sessionId);
    if (session) {
      setSessionToCounterOffer(session);
      setShowCounterOfferModal(true);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    showConfirmation(
      'Delete Session',
      'Are you sure you want to delete this session request? This action cannot be undone.',
      async () => {
        setProcessingSession(sessionId);
        try {
          const response = await fetch(`/api/session/${sessionId}`, {
            method: 'DELETE',
          });

          const data = await response.json();
          
          if (data.success) {
            fetchSessions(); // Refresh sessions
            showAlert('success', 'Session deleted successfully!');
          } else {
            showAlert('error', data.message || 'Failed to delete session');
          }
        } catch (error) {
          console.error('Error deleting session:', error);
          showAlert('error', 'Failed to delete session');
        } finally {
          setProcessingSession(null);
        }
      },
      'danger',
      'Delete'
    );
  };

  const handleEditSession = (sessionId: string) => {
    const session = sessions.find(s => s._id === sessionId);
    if (session) {
      setSessionToEdit(session);
      setShowEditModal(true);
    }
  };

  const handleCounterOfferResponse = async (counterOfferId: string, action: 'accept' | 'reject') => {
    setProcessingSession(counterOfferId);
    try {
      const response = await fetch(`/api/session/counter-offer/${counterOfferId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSessions(); // Refresh sessions and counter offers
        showAlert('success', `Counter offer ${action}ed successfully!`);
      } else {
        showAlert('error', data.message || `Failed to ${action} counter offer`);
      }
    } catch (error) {
      console.error(`Error ${action}ing counter offer:`, error);
      showAlert('error', `Failed to ${action} counter offer`);
    } finally {
      setProcessingSession(null);
    }
  };

  const handleRequestCompletion = async (sessionId: string) => {
    showConfirmation(
      'Request Session Completion',
      'Are you sure you want to request session completion? This will notify the other participant for approval.',
      async () => {
        setProcessingSession(sessionId);
        
        try {
          const response = await fetch('/api/session/completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              userId,
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            showAlert('success', 'Completion request sent successfully! Waiting for approval from the other participant.');
            fetchSessions(); // Refresh sessions to show completion request
          } else {
            showAlert('error', data.message || 'Failed to request completion');
          }
        } catch (error) {
          console.error('Error requesting completion:', error);
          showAlert('error', 'Failed to request completion');
        } finally {
          setProcessingSession(null);
        }
      },
      'info',
      'Send Request'
    );
  };

  const handleCompletionResponse = async (sessionId: string, action: 'approve' | 'reject', providedRejectionReason?: string) => {
    // For rejection, show modal to collect reason if not provided
    if (action === 'reject' && !providedRejectionReason) {
      setSessionForRejection(sessionId);
      setShowRejectionModal(true);
      return;
    }

    const confirmMessage = action === 'approve' 
      ? 'Are you sure you want to approve session completion? This will mark the session as completed.'
      : 'Are you sure you want to reject the completion request?';

    showConfirmation(
      action === 'approve' ? 'Approve Completion' : 'Reject Completion',
      confirmMessage,
      async () => {
        setProcessingSession(sessionId);
        
        try {
          const requestBody: any = {
            sessionId,
            userId,
            action,
          };

          // Add rejection reason if rejecting
          if (action === 'reject' && providedRejectionReason) {
            requestBody.rejectionReason = providedRejectionReason;
          }

          const response = await fetch('/api/session/completion', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          
          if (data.success) {
            if (action === 'approve') {
              showAlert('success', 'Session completed successfully!');
              
              // Force immediate refresh to get updated session status
              await fetchSessions();
              
              // Show rating modal for the user who approved
              const completedSession = sessions.find(s => s._id === sessionId);
              if (completedSession) {
                setSessionToRate(completedSession);
                setShowRatingModal(true);
              }
            } else {
              showAlert('info', 'Completion request rejected');
            }
            
            // Additional refresh after a delay to ensure database consistency
            setTimeout(() => {
              fetchSessions();
            }, 1000);
            
            // Close modal if it was open
            if (action === 'reject') {
              setShowRejectionModal(false);
              setRejectionReason('');
              setSessionForRejection(null);
            }
          } else {
            showAlert('error', data.message || `Failed to ${action} completion`);
          }
        } catch (error) {
          console.error(`Error ${action}ing completion:`, error);
          showAlert('error', `Failed to ${action} completion`);
        } finally {
          setProcessingSession(null);
        }
      },
      action === 'approve' ? 'success' : 'warning',
      action === 'approve' ? 'Approve' : 'Reject'
    );
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      showAlert('warning', 'Please provide a reason for declining the completion request');
      return;
    }
    if (sessionForRejection) {
      handleCompletionResponse(sessionForRejection, 'reject', rejectionReason.trim());
    }
  };

  const handleRatingSubmit = async () => {
    if (!sessionToRate || rating === 0) {
      showAlert('warning', 'Please provide a rating');
      return;
    }

    if (!ratingComment.trim()) {
      showAlert('warning', 'Please provide a comment');
      return;
    }

    setSubmittingRating(true);

    try {
      // Determine the other user and skill details
      const otherUser = sessionToRate.user1Id._id === userId ? sessionToRate.user2Id : sessionToRate.user1Id;
      const mySkill = sessionToRate.user1Id._id === userId ? sessionToRate.skill1Id : sessionToRate.skill2Id;

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionToRate._id,
          reviewerId: userId,
          revieweeId: otherUser._id,
          rating,
          comment: ratingComment.trim(),
          skillId: mySkill._id,
          reviewType: 'skill_learning', // Since we're rating the other person's teaching
        }),
      });

      const data = await response.json();

      if (data.success) {
        showAlert('success', 'Rating submitted successfully!');
        setShowRatingModal(false);
        setSessionToRate(null);
        setRating(0);
        setRatingComment('');
      } else {
        showAlert('error', data.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showAlert('error', 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const toggleActiveCounterOffers = (sessionId: string) => {
    setShowActiveCounterOffers(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const getActiveCounterOffersCount = (sessionId: string) => {
    const sessionCounterOffers = counterOffers[sessionId] || [];
    return sessionCounterOffers.filter(co => co.status === 'accepted').length;
  };

  const getPendingCounterOffersCount = (sessionId: string) => {
    const sessionCounterOffers = counterOffers[sessionId] || [];
    return sessionCounterOffers.filter(co => co.status === 'pending').length;
  };

  const getSessionStatus = (session: Session) => {
    // The API should provide correct status, but add fallback logic
    if (session.status === 'completed') return 'completed';
    if (session.status === 'canceled') return 'canceled';
    if (session.status === 'rejected') return 'rejected';
    if (session.status === 'active') return 'accepted';  // Show "accepted" for active sessions
    if (session.status === 'pending') return 'pending';
    
    // Legacy fallback based on isAccepted field
    if (session.isAccepted === null) return 'pending';
    if (session.isAccepted === true) return 'accepted';
    if (session.isAccepted === false) return 'rejected';
    
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-blue-600 bg-blue-50 border border-blue-200';
      case 'canceled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'canceled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isCurrentUserReceiver = (session: Session) => {
    return session.user2Id._id === userId;
  };

  const isCurrentUserCreator = (session: Session) => {
    return session.user1Id._id === userId;
  };

  const canRespond = (session: Session) => {
    return isCurrentUserReceiver(session) && session.isAccepted === null;
  };

  const canEditOrDelete = (session: Session) => {
    return isCurrentUserCreator(session) && session.isAccepted === null;
  };

  const renderSessionCard = (session: Session) => {
    const status = getSessionStatus(session);
    const isReceiver = isCurrentUserReceiver(session);
    const isExpanded = expandedSessions.has(session._id);
    const pendingCounterOffers = getPendingCounterOffersCount(session._id);
    const activeCounterOffers = getActiveCounterOffersCount(session._id);
    const hasCounterOffers = counterOffers[session._id] && counterOffers[session._id].length > 0;
    
    return (
      <div key={session._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {/* Session Header - Always Visible */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                <span className="capitalize">{status === 'completed' ? 'Completed' : status}</span>
              </span>
              
              {/* Status Indicators */}
              {isReceiver && status === 'pending' && (
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                  Request for you
                </span>
              )}
              {isCurrentUserCreator(session) && status === 'pending' && (
                <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
                  Your request
                </span>
              )}
              
              {/* Counter Offer Indicators */}
              {pendingCounterOffers > 0 && (
                <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full border border-orange-200 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{pendingCounterOffers} pending counter{pendingCounterOffers > 1 ? 's' : ''}</span>
                </span>
              )}
              
              {activeCounterOffers > 0 && status === 'accepted' && (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  {activeCounterOffers} active counter{activeCounterOffers > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <button
              onClick={() => toggleSessionExpansion(session._id)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="text-xs text-gray-500">
                {formatDate(session.startDate)}
              </div>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Compact Skills Preview */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-900">
                {session.skill1Id?.skillTitle || session.skill1Id?.skillName || 'Skill Not Found'}
              </span>
              <span className="text-gray-500">by</span>
              <span className="text-gray-700">
                {session.user1Id._id === userId ? 'You' : 
                  (session.user1Id.firstName && session.user1Id.lastName ? 
                    `${session.user1Id.firstName} ${session.user1Id.lastName}` : 
                    session.user1Id.name || 'Unknown User')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-900">
                {session.skill2Id?.skillTitle || session.skill2Id?.skillName || 'Skill Not Found'}
              </span>
              <span className="text-gray-500">by</span>
              <span className="text-gray-700">
                {session.user2Id._id === userId ? 'You' : 
                  (session.user2Id.firstName && session.user2Id.lastName ? 
                    `${session.user2Id.firstName} ${session.user2Id.lastName}` : 
                    session.user2Id.name || 'Unknown User')}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Detailed Skills Information */}
            <div className="space-y-4">
              {/* What they offer */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900">
                    {session.user1Id._id === userId ? 'You offer:' : 
                      `${session.user1Id.firstName && session.user1Id.lastName ? 
                        `${session.user1Id.firstName} ${session.user1Id.lastName}` : 
                        session.user1Id.name || 'Unknown User'} offers:`}
                  </h4>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-blue-900 text-lg">
                      {session.skill1Id?.skillTitle || session.skill1Id?.skillName || 'Skill Not Found'}
                    </h5>
                    {session.skill1Id?.proficiencyLevel && (
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                        {session.skill1Id.proficiencyLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    <span className="font-medium">Description:</span> {session.descriptionOfService1}
                  </p>
                </div>
              </div>

              {/* What they want */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium text-gray-900">
                    {session.user2Id._id === userId ? 'You provide:' : 
                      `${session.user2Id.firstName && session.user2Id.lastName ? 
                        `${session.user2Id.firstName} ${session.user2Id.lastName}` : 
                        session.user2Id.name || 'Unknown User'} provides:`}
                  </h4>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-green-900 text-lg">
                      {session.skill2Id?.skillTitle || session.skill2Id?.skillName || 'Skill Not Found'}
                    </h5>
                    {session.skill2Id?.proficiencyLevel && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                        {session.skill2Id.proficiencyLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    <span className="font-medium">Description:</span> {session.descriptionOfService2}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
              {/* Show only View button for completed sessions */}
              {status === 'completed' ? (
                <button
                  onClick={() => router.push(`/session/${session._id}?userId=${userId}`)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Completed Session</span>
                </button>
              ) : (
                <>
                  {/* Buttons for Session Receiver */}
                  {canRespond(session) && (
                    <>
                      <button
                        onClick={() => handleAcceptReject(session._id, 'accept')}
                        disabled={processingSession === session._id}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleCounterOffer(session._id)}
                        disabled={processingSession === session._id}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Counter Offer</span>
                      </button>
                      <button
                        onClick={() => handleAcceptReject(session._id, 'reject')}
                        disabled={processingSession === session._id}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {/* Buttons for Session Creator */}
                  {canEditOrDelete(session) && (
                    <>
                      <button
                        onClick={() => handleEditSession(session._id)}
                        disabled={processingSession === session._id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session._id)}
                        disabled={processingSession === session._id}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}

                  {/* View Button for Active Sessions */}
                  {session.isAccepted === true && (
                    <button
                      onClick={() => router.push(`/session/${session._id}?userId=${userId}`)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Session</span>
                    </button>
                  )}

                  {/* Session Completion Buttons */}
                  {session.isAccepted === true && session.status !== 'completed' && (
                    <>
                      {session.completionRequestedBy ? (
                        <>
                          {(session.completionRequestedBy._id === userId || session.completionRequestedBy === userId) ? (
                            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                              Completion requested - waiting for approval
                            </span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCompletionResponse(session._id, 'approve')}
                                disabled={processingSession === session._id}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Approve Completion</span>
                              </button>
                              <button
                                onClick={() => handleCompletionResponse(session._id, 'reject')}
                                disabled={processingSession === session._id}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : session.completionRejectedBy ? (
                        <button
                          onClick={() => handleRequestCompletion(session._id)}
                          disabled={processingSession === session._id}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Request Completion Again</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRequestCompletion(session._id)}
                          disabled={processingSession === session._id}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Request Completion</span>
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Session Progress Info for Active/Completed Sessions */}
            {session.isAccepted === true && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {session.status === 'completed' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-semibold text-green-800">
                        Session Successfully Completed! 🎉
                      </p>
                    </div>
                    <p className="text-xs text-green-700">
                      Both participants have completed their skill exchange. You can view the session details, submitted work, and reviews.
                    </p>
                  </div>
                ) : session.completionRequestedBy ? (
                  <div className="space-y-2">
                    <p className="text-sm text-blue-600">
                      🔄 Completion request pending approval
                    </p>
                    {session.completionRequestedBy._id === userId || session.completionRequestedBy === userId ? (
                      <p className="text-xs text-gray-600">
                        You requested completion on {formatDate(session.completionRequestedAt || '')}. Waiting for {getUserDisplayName(otherUser)} to approve.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600">
                        {getUserDisplayName(otherUser)} requested completion on {formatDate(session.completionRequestedAt || '')}. Please review above.
                      </p>
                    )}
                  </div>
                ) : session.completionRejectedBy ? (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600">
                      ❌ Completion request was declined
                    </p>
                    <p className="text-xs text-gray-600">
                      Declined on {formatDate(session.completionRejectedAt || '')}.
                    </p>
                    {session.completionRejectionReason && (
                      <div className="text-xs bg-red-50 border border-red-200 rounded p-2">
                        <span className="font-medium text-red-800">Reason:</span> {session.completionRejectionReason}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    🎉 Session accepted! Progress tracking has been created for both participants.
                  </p>
                )}
              </div>
            )}

            {/* Counter Offers Section */}
            {hasCounterOffers && (
              <div className="space-y-3">
                {/* Pending Counter Offers */}
                {counterOffers[session._id].filter(co => co.status === 'pending').length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span>Pending Counter Offers ({counterOffers[session._id].filter(co => co.status === 'pending').length})</span>
                    </h4>
                    <div className="space-y-3">
                      {counterOffers[session._id].filter(co => co.status === 'pending').map((counterOffer) => renderCounterOffer(counterOffer))}
                    </div>
                  </div>
                )}

                {/* Active Counter Offers - Collapsible */}
                {activeCounterOffers > 0 && (
                  <div>
                    <button
                      onClick={() => toggleActiveCounterOffers(session._id)}
                      className="flex items-center justify-between w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Accepted Counter Offers ({activeCounterOffers})
                        </span>
                      </div>
                      {showActiveCounterOffers[session._id] ? 
                        <ChevronDown className="h-4 w-4 text-green-600" /> : 
                        <ChevronRight className="h-4 w-4 text-green-600" />
                      }
                    </button>

                    {showActiveCounterOffers[session._id] && (
                      <div className="mt-3 space-y-3">
                        {counterOffers[session._id].filter(co => co.status === 'accepted').map((counterOffer) => renderCounterOffer(counterOffer))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCounterOffer = (counterOffer: CounterOffer) => {
    return (
      <div key={counterOffer._id} className={`border rounded-lg p-4 ${
        counterOffer.status === 'pending' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              counterOffer.status === 'pending' ? 'text-orange-900' : 'text-green-900'
            }`}>
              Counter offer by {getCounterOfferUserName(counterOffer.counterOfferedBy)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              counterOffer.status === 'pending' 
                ? 'bg-orange-200 text-orange-800' 
                : 'bg-green-200 text-green-800'
            }`}>
              {counterOffer.status}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(counterOffer.createdAt)}
          </div>
        </div>
        
        <p className={`text-sm mb-3 italic ${
          counterOffer.status === 'pending' ? 'text-orange-800' : 'text-green-800'
        }`}>
          "{counterOffer.counterOfferMessage}"
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="bg-white p-3 rounded border">
            <div className="text-xs font-medium text-gray-600 mb-1">Offered Skill:</div>
            <div className="text-sm font-semibold text-blue-900">
              {counterOffer.skill1Id?.skillTitle || counterOffer.skill1Id?.skillName || 'Skill not available'}
            </div>
            <div className="text-xs text-gray-600 mt-1">{counterOffer.descriptionOfService1}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-xs font-medium text-gray-600 mb-1">Requested Skill:</div>
            <div className="text-sm font-semibold text-green-900">
              {counterOffer.skill2Id?.skillTitle || counterOffer.skill2Id?.skillName || 'Skill not available'}
            </div>
            <div className="text-xs text-gray-600 mt-1">{counterOffer.descriptionOfService2}</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 mb-3">
          <div>Proposed date: {formatDate(counterOffer.startDate)}</div>
          {counterOffer.expectedEndDate && (
            <div>Expected end: {formatDate(counterOffer.expectedEndDate)}</div>
          )}
        </div>
        
        {/* Counter Offer Actions */}
        {counterOffer.status === 'pending' && counterOffer.counterOfferedBy._id !== userId && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCounterOfferResponse(counterOffer._id, 'accept')}
              disabled={processingSession === counterOffer._id}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              Accept Counter Offer
            </button>
            <button
              onClick={() => handleCounterOfferResponse(counterOffer._id, 'reject')}
              disabled={processingSession === counterOffer._id}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              Reject Counter Offer
            </button>
          </div>
        )}
        
        {counterOffer.status === 'pending' && counterOffer.counterOfferedBy._id === userId && (
          <div className="text-sm text-orange-700">
            Waiting for response...
          </div>
        )}
      </div>
    );
  };

  if (loading || userLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Failed to load user information</p>
      </div>
    );
  }

  const otherUserName = getUserDisplayName(otherUser);
  const processedAvatarUrl = processAvatarUrl(otherUser.avatar);

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {processedAvatarUrl && (
            <img 
              src={processedAvatarUrl} 
              alt={otherUserName}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Skill Swap Sessions with {otherUserName}
            </h2>
            {otherUser.title && (
              <p className="text-sm text-gray-600">{otherUser.title}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={activeSessionCount >= 3}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            activeSessionCount >= 3 
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title={activeSessionCount >= 3 ? 'Maximum 3 active sessions allowed between you and this user' : 'Create new session request'}
        >
          <Plus className="h-4 w-4" />
          <span>New Session</span>
          {activeSessionCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {activeSessionCount}/3
            </span>
          )}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-4">
              Start your first skill swap session with {getUserDisplayName(otherUser)}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={activeSessionCount >= 3}
              className={`px-6 py-2 rounded-lg transition-colors ${
                activeSessionCount >= 3 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              title={activeSessionCount >= 3 ? 'Maximum 3 active sessions allowed between you and this user' : 'Create your first session'}
            >
              Create Session
              {activeSessionCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeSessionCount}/3
                </span>
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Group sessions by status for better organization */}
            {(() => {
              const activeSessions = sessions.filter(session => {
                const status = getSessionStatus(session);
                return status !== 'canceled' && status !== 'rejected';
              });

              const pendingSessions = activeSessions.filter(session => getSessionStatus(session) === 'pending');
              const acceptedSessions = activeSessions.filter(session => getSessionStatus(session) === 'accepted');
              const completedSessions = activeSessions.filter(session => getSessionStatus(session) === 'completed');

              return (
                <div className="space-y-6">
                  {/* Pending Sessions */}
                  {pendingSessions.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pending Requests ({pendingSessions.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {pendingSessions.map((session) => renderSessionCard(session))}
                      </div>
                    </div>
                  )}

                  {/* Active Sessions */}
                  {acceptedSessions.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Active Sessions ({acceptedSessions.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {acceptedSessions.map((session) => renderSessionCard(session))}
                      </div>
                    </div>
                  )}

                  {/* Completed Sessions */}
                  {completedSessions.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Completed Sessions ({completedSessions.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {completedSessions.map((session) => renderSessionCard(session))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Cancelled/Rejected Sessions Section */}
          {sessions.filter(session => {
            const status = getSessionStatus(session);
            return status === 'canceled' || status === 'rejected';
          }).length > 0 && (
            <div className="border-t border-gray-200 pt-4 mt-6">
              <button
                onClick={() => setShowCancelledSessions(!showCancelledSessions)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Cancelled & Rejected Sessions ({sessions.filter(session => {
                      const status = getSessionStatus(session);
                      return status === 'canceled' || status === 'rejected';
                    }).length})
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
                  showCancelledSessions ? 'rotate-180' : ''
                }`} />
              </button>

              {showCancelledSessions && (
                <div className="mt-3 space-y-3">
                  {sessions.filter(session => {
                    const status = getSessionStatus(session);
                    return status === 'canceled' || status === 'rejected';
                  }).map((session) => {
                    const status = getSessionStatus(session);
                    
                    return (
                      <div key={`cancelled-${session._id}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        {/* Cancelled Session Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                              status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              <XCircle className="h-3 w-3" />
                              <span className="capitalize">{status}</span>
                            </span>
                            {status === 'rejected' && session.rejectedBy && (
                              <span className="text-xs text-gray-600">
                                by {session.rejectedBy._id === userId ? 'you' : 
                                (typeof session.rejectedBy === 'object' && session.rejectedBy.firstName && session.rejectedBy.lastName 
                                  ? `${session.rejectedBy.firstName} ${session.rejectedBy.lastName}`
                                  : 'other user')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {status === 'rejected' && session.rejectedAt ? formatDate(session.rejectedAt) :
                             formatDate(session.createdAt || new Date().toISOString())}
                          </div>
                        </div>

                        {/* Session Skills Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="bg-white p-3 rounded border">
                            <div className="text-xs font-medium text-gray-600 mb-1">Offered:</div>
                            <div className="text-sm font-semibold text-blue-900">
                              {session.skill1Id?.skillTitle || session.skill1Id?.title || 'Skill not available'}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-xs font-medium text-gray-600 mb-1">Requested:</div>
                            <div className="text-sm font-semibold text-green-900">
                              {session.skill2Id?.skillTitle || session.skill2Id?.title || 'Skill not available'}
                            </div>
                          </div>
                        </div>

                        {/* Cancellation/Rejection Reason if available */}
                        {session.completionRejectionReason && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                            <span className="font-medium">Reason:</span> {session.completionRejectionReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
        )}
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchSessions(); // Refresh sessions when modal closes
        }}
        currentUserId={userId}
        otherUserId={otherUserId}
        otherUserName={otherUserName}
        chatRoomId={chatRoomId}
        activeSessionCount={activeSessionCount}
      />

      {/* Edit Session Modal */}
      <EditSessionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSessionToEdit(null);
        }}
        session={sessionToEdit}
        currentUserId={userId}
        onSessionUpdated={() => {
          fetchSessions(); // Refresh sessions when updated
          setShowEditModal(false);
          setSessionToEdit(null);
        }}
      />

      {/* Counter Offer Modal */}
      <CounterOfferModal
        isOpen={showCounterOfferModal}
        onClose={() => {
          setShowCounterOfferModal(false);
          setSessionToCounterOffer(null);
        }}
        session={sessionToCounterOffer}
        currentUserId={userId}
        onCounterOfferCreated={() => {
          fetchSessions(); // Refresh sessions when counter offer is created
          setShowCounterOfferModal(false);
          setSessionToCounterOffer(null);
        }}
      />

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Decline Completion Request</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Declining *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for declining the completion request..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setSessionForRejection(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectionSubmit}
                  disabled={processingSession === sessionForRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {processingSession === sessionForRejection ? 'Submitting...' : 'Submit Rejection Reason'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && sessionToRate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Your Experience</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1 to 5) *
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={0}>Select a rating</option>
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2 - Fair</option>
                  <option value={3}>3 - Good</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment *
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setSessionToRate(null);
                    setRating(0);
                    setRatingComment('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRatingSubmit}
                  disabled={submittingRating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Component */}
      <Alert
        type={alert.type}
        title={alert.title}
        message={alert.message}
        isOpen={alert.isOpen}
        onClose={closeAlert}
        autoClose={true}
        autoCloseDelay={4000}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={() => {
          confirmation.onConfirm();
          closeConfirmation();
        }}
        title={confirmation.title}
        message={confirmation.message}
        type={confirmation.type}
        confirmText={confirmation.confirmText}
        loading={confirmation.loading}
      />
    </div>
  );
}