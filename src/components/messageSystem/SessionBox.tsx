"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, BookOpen, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateSessionModal from '@/components/sessionSystem/CreateSessionModal';
import EditSessionModal from '@/components/sessionSystem/EditSessionModal';
import CounterOfferModal from '@/components/sessionSystem/CounterOfferModal';
import SessionListContainer from '@/components/sessionSystem/SessionListContainer';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { processAvatarUrl } from '@/utils/avatarUtils';
import { useSessionActions } from '@/hooks/useSessionActions';

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
  otherUser?: UserProfile; // Optional: pass user data from parent to avoid fetch
  onSessionUpdate?: () => void; // Callback to notify parent about session changes
}

export default function SessionBox({ chatRoomId, userId, otherUserId, otherUser: passedOtherUser, onSessionUpdate }: SessionBoxProps) {
  const router = useRouter();
  const [otherUser, setOtherUser] = useState<UserProfile | null>(passedOtherUser || null);
  const [userLoading, setUserLoading] = useState(!passedOtherUser);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [sessionToCounterOffer, setSessionToCounterOffer] = useState<Session | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [sessionForRejection, setSessionForRejection] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [sessionToRate, setSessionToRate] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showCancelledSessions, setShowCancelledSessions] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [showActiveCounterOffers, setShowActiveCounterOffers] = useState<{[sessionId: string]: boolean}>({});
  
  // Track existing reviews for sessions
  const [sessionReviews, setSessionReviews] = useState<{[sessionId: string]: any}>({});

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

  // Use the custom hook for session actions
  const {
    sessions,
    counterOffers,
    loading,
    processingSession,
    pendingSessionCount,
    activeSessionCount,
    fetchSessions,
    handleAcceptReject,
    handleDeleteSession,
    handleCounterOfferResponse,
    handleRequestCompletion,
    handleCompletionResponse,
    handleRatingSubmit
  } = useSessionActions({
    userId,
    otherUserId,
    onSessionUpdate,
    showAlert,
    showConfirmation
  });

  // Fetch other user's information only if not passed from parent
  useEffect(() => {
    const fetchOtherUser = async () => {
      // Skip fetch if user data is already provided
      if (passedOtherUser) {
        setOtherUser(passedOtherUser);
        setUserLoading(false);
        return;
      }

      if (!otherUserId) return;

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

    fetchOtherUser();
  }, [otherUserId, passedOtherUser]);

  // Fetch sessions with optimized timing
  useEffect(() => {
    // Only fetch sessions if we have both user IDs and other user is loaded
    if (userId && otherUserId && !userLoading) {
      // Use requestIdleCallback for better performance, fallback to timeout
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          fetchSessions();
        });
      } else {
        // Small delay to prevent rapid-fire requests
        const timeoutId = setTimeout(() => {
          fetchSessions();
        }, 50); // Reduced from 100ms
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [userId, otherUserId, fetchSessions, userLoading]);

  // Memoized helper functions for better performance
  const getUserDisplayName = useCallback((user: UserProfile | null): string => {
    if (!user) return 'Unknown User';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) return user.name;
    return user.email || 'Unknown User';
  }, []);

  const getCounterOfferUserName = useCallback((counterOfferedBy: any): string => {
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
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  }, []);

  const closeConfirmation = useCallback(() => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Check if user has already reviewed a session
  const checkExistingReview = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/reviews?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (data.success && data.reviews) {
        const userReview = data.reviews.find((review: any) => review.reviewerId._id === userId);
        if (userReview) {
          setSessionReviews(prev => ({
            ...prev,
            [sessionId]: userReview
          }));
          return userReview;
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking existing review:', error);
      return null;
    }
  }, [userId]);

  // Memoized handler functions
  const handleCounterOffer = useCallback((sessionId: string) => {
    const session = sessions.find(s => s._id === sessionId);
    if (session) {
      setSessionToCounterOffer(session);
      setShowCounterOfferModal(true);
    }
  }, [sessions]);

  const handleEditSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s._id === sessionId);
    if (session) {
      setSessionToEdit(session);
      setShowEditModal(true);
    }
  }, [sessions]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const toggleSessionExpansion = useCallback((sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  }, []);

  const toggleActiveCounterOffers = useCallback((sessionId: string) => {
    setShowActiveCounterOffers(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  }, []);

  const getSessionStatus = useCallback((session: Session) => {
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
  }, []);

  const handleCompletionResponseWithModal = async (sessionId: string, action: 'approve' | 'reject', providedRejectionReason?: string) => {
    // For rejection, show modal to collect reason if not provided
    if (action === 'reject' && !providedRejectionReason) {
      setSessionForRejection(sessionId);
      setShowRejectionModal(true);
      return;
    }

    if (action === 'approve') {
      // Check if user has already reviewed this session before showing rating modal
      const existingReview = await checkExistingReview(sessionId);
      
      handleCompletionResponse(sessionId, action, providedRejectionReason, (session) => {
        // Only show rating modal if user hasn't reviewed yet
        if (!existingReview) {
          setSessionToRate(session);
          setShowRatingModal(true);
        } else {
          showAlert('info', 'Session completed successfully! You have already submitted a review for this session.');
        }
      });
    } else {
      handleCompletionResponse(sessionId, action, providedRejectionReason);
    }
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      showAlert('warning', 'Please provide a reason for declining the completion request');
      return;
    }
    if (sessionForRejection) {
      handleCompletionResponseWithModal(sessionForRejection, 'reject', rejectionReason.trim());
      setShowRejectionModal(false);
      setRejectionReason('');
      setSessionForRejection(null);
    }
  };

  // Star rating handlers
  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  const handleRatingSubmitLocal = async () => {
    if (!sessionToRate) return;

    // Validate rating and comment
    if (rating === 0) {
      showAlert('warning', 'Please select a rating');
      return;
    }

    if (!ratingComment.trim()) {
      showAlert('warning', 'Please provide a comment');
      return;
    }

    setSubmittingRating(true);
    const success = await handleRatingSubmit(sessionToRate, rating, ratingComment, async () => {
      // Update the session reviews to show the new review immediately
      if (sessionToRate?._id) {
        const response = await fetch(`/api/reviews?sessionId=${sessionToRate._id}`);
        const data = await response.json();
        
        if (data.success && data.reviews) {
          const userReview = data.reviews.find((review: any) => review.reviewerId._id === userId);
          if (userReview) {
            setSessionReviews(prev => ({
              ...prev,
              [sessionToRate._id]: userReview
            }));
          }
        }
      }
      
      setShowRatingModal(false);
      setSessionToRate(null);
      setRating(0);
      setHoveredRating(0);
      setRatingComment('');
    });
    setSubmittingRating(false);
  };

  // Memoized loading component
  const LoadingComponent = useMemo(() => (
    <div className="p-6 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-2 text-gray-600">Loading...</p>
    </div>
  ), []);

  // Memoized error component
  const ErrorComponent = useMemo(() => (
    <div className="p-6 text-center">
      <p className="text-red-600">Failed to load user information</p>
    </div>
  ), []);

  if (loading || userLoading) {
    return LoadingComponent;
  }

  if (!otherUser) {
    return ErrorComponent;
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
          <SessionListContainer
            sessions={sessions}
            userId={userId}
            otherUser={otherUser}
            counterOffers={counterOffers}
            expandedSessions={expandedSessions}
            showActiveCounterOffers={showActiveCounterOffers}
            processingSession={processingSession}
            showCancelledSessions={showCancelledSessions}
            onToggleExpansion={toggleSessionExpansion}
            onToggleActiveCounterOffers={toggleActiveCounterOffers}
            onToggleCancelledSessions={() => setShowCancelledSessions(!showCancelledSessions)}
            onAcceptReject={handleAcceptReject}
            onCounterOffer={handleCounterOffer}
            onEditSession={handleEditSession}
            onDeleteSession={handleDeleteSession}
            onRequestCompletion={handleRequestCompletion}
            onCompletionResponse={handleCompletionResponseWithModal}
            onCounterOfferResponse={handleCounterOfferResponse}
            formatDate={formatDate}
            getUserDisplayName={getUserDisplayName}
            getCounterOfferUserName={getCounterOfferUserName}
            getSessionStatus={getSessionStatus}
          />
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
                  Rating *
                </label>
                
                {/* Star Rating */}
                <div className="flex items-center space-x-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={handleStarLeave}
                      className="focus:outline-none transition-colors"
                    >
                      <Star 
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                
                {/* Rating Text */}
                <p className="text-sm text-gray-600 mb-2">
                  {rating > 0 ? getRatingText(rating) : 'Click on stars to rate'}
                </p>
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
                    setHoveredRating(0);
                    setRatingComment('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRatingSubmitLocal}
                  disabled={submittingRating || rating === 0 || !ratingComment.trim()}
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