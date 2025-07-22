import { CheckCircle, Clock, AlertCircle, User, BookOpen, XCircle, X, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useOverview } from '../../hooks/useOverview';
import CancelSessionForm from '../sessionTabs/CancelSessionForm';
import CancelResponseForm from '../sessionTabs/CancelResponseForm';
import CompletionRequestModal from '../sessionSystem/CompletionRequestModal';
import UserReviewModal from '../sessionSystem/UserReviewModal';
import { getSessionCompletionStatus, CompletionStatus } from '../../utils/sessionCompletion';

interface OverviewTabProps {
  session: any;
  currentUserId: string;
  works: any[];
  myProgress: any;
  otherProgress: any;
  user: any;
  otherUserDetails: any;
  showAlert: (type: string, message: string, title?: string) => void;
  setActiveTab: (tab: string) => void;
  onSessionUpdate?: () => void; // Callback to refresh session data
}

export default function OverviewTab({
  session,
  currentUserId,
  works,
  myProgress,
  otherProgress,
  user,
  otherUserDetails,
  showAlert,
  setActiveTab,
  onSessionUpdate,
}: OverviewTabProps) {
  const {
    // Data
    reviews,
    userReview,
    receivedReview,
    loadingReviews,
    cancelRequest,
    loadingCancelRequest,
    // completionStatus, // Removed - using new implementation
    
    // Loading states
    requestingCompletion,
    respondingToCompletion,
    
    // Modal states
    showReviewModal,
    setShowReviewModal,
    showCancelModal,
    setShowCancelModal,
    showCancelResponseModal,
    setShowCancelResponseModal,
    showCancelFinalizeModal,
    setShowCancelFinalizeModal,
    
    // Utility functions
    formatDate,
    getOtherUserName,
    getUserName,
    cleanDescription,
    getExpectedEndDate,
    
    // Actions
    handleRequestCompletion,
    handleCompletionResponse,
    handleCancelSession,
    handleCancelResponse,
    handleDownloadFile,
    setActiveTab: setActiveTabHook,
    setShowReviewModal: setShowReviewModalHook,
    setShowCancelModal: setShowCancelModalHook,
    setShowCancelResponseModal: setShowCancelResponseModalHook,
    setShowCancelFinalizeModal: setShowCancelFinalizeModalHook,
    
    // Refresh functions
    fetchReviews,
  } = useOverview({
    session,
    currentUserId,
    onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => 
      showAlert(type, message, title),
    onTabChange: setActiveTab,
    onSessionUpdate,
    works,
    myProgress,
    otherProgress,
    user,
    otherUserDetails,
  });

  // Local state for new modals
  const [showCompletionRequestModal, setShowCompletionRequestModal] = useState(false);
  const [showUserReviewModal, setShowUserReviewModal] = useState(false);
  const [completionRequestLoading, setCompletionRequestLoading] = useState(false);

  // Enhanced completion status using new API
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    canRequestCompletion: false,
    hasRequestedCompletion: false,
    needsToApprove: false,
    wasRejected: false,
    isCompleted: false,
    pendingRequests: []
  });
  const [loadingCompletionStatus, setLoadingCompletionStatus] = useState(true);

  // Fetch completion status
  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!session?._id || !currentUserId) return;
      
      setLoadingCompletionStatus(true);
      try {
        const status = await getSessionCompletionStatus(session._id, currentUserId);
        setCompletionStatus(status);
      } catch (error) {
        console.error('Error fetching completion status:', error);
      } finally {
        setLoadingCompletionStatus(false);
      }
    };

    fetchCompletionStatus();
  }, [session?._id, currentUserId]);

  // Refresh completion status after actions
  const refreshCompletionStatus = async () => {
    if (!session?._id || !currentUserId) return;
    
    try {
      const status = await getSessionCompletionStatus(session._id, currentUserId);
      setCompletionStatus(status);
    } catch (error) {
      console.error('Error refreshing completion status:', error);
    }
  };

  const otherUser = session.user1Id?._id === currentUserId ? session.user2Id : session.user1Id;
  const mySkill = session.user1Id?._id === currentUserId ? session.skill1Id : session.skill2Id;
  const otherSkill = session.user1Id?._id === currentUserId ? session.skill2Id : session.skill1Id;
  const myDescription = session.user1Id?._id === currentUserId ? session.descriptionOfService1 : session.descriptionOfService2;
  const otherDescription = session.user1Id?._id === currentUserId ? session.descriptionOfService2 : session.descriptionOfService1;

  // Enhanced completion request handler
  const handleEnhancedCompletionRequest = () => {
    setShowCompletionRequestModal(true);
  };

  // Handle completion request confirmation from modal
  const handleConfirmCompletionRequest = async () => {
    setCompletionRequestLoading(true);
    try {
      await handleRequestCompletion();
      setShowCompletionRequestModal(false);
      await refreshCompletionStatus(); // Refresh status after request
      showAlert('success', 'Completion request sent successfully! The other participant will be notified.');
    } catch (error) {
      showAlert('error', 'Failed to send completion request. Please try again.');
    } finally {
      setCompletionRequestLoading(false);
    }
  };

  // Handle completion response with review modal
  const handleEnhancedCompletionResponse = async (action: 'approve' | 'reject') => {
    if (action === 'approve') {
      try {
        await handleCompletionResponse(action);
        await refreshCompletionStatus(); // Refresh status after response
        // Show review modal after successful approval
        setShowUserReviewModal(true);
        showAlert('success', 'Session completed successfully! Please leave a review for your partner.');
      } catch (error) {
        showAlert('error', 'Failed to approve completion. Please try again.');
      }
    } else {
      // Handle rejection normally (might want to add rejection reason modal later)
      await handleCompletionResponse(action);
      await refreshCompletionStatus(); // Refresh status after rejection
    }
  };

  const handleReviewSubmitted = async () => {
    showAlert('success', 'Thank you for your review! It helps build trust in our community.');
    
    // Refresh review data to show the submitted review immediately
    await fetchReviews();
    
    if (onSessionUpdate) {
      onSessionUpdate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Completion Request Status - Shows at top when there's an active completion request */}
      {completionStatus.hasRequestedCompletion && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-full">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Session Completion Requested
                </h3>
                <p className="text-blue-700 text-sm">
                  Waiting for {otherUser?.firstName || 'the other participant'} to approve the completion
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Pending Approval</span>
            </div>
          </div>
        </div>
      )}
      
      {completionStatus.needsToApprove && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-lg mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Completion Request Received
                </h3>
                <p className="text-green-700 text-sm">
                  {otherUser?.firstName || 'The other participant'} has requested to complete this session
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleEnhancedCompletionResponse('approve')}
                disabled={respondingToCompletion}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2 text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve & Review</span>
              </button>
              <button
                onClick={() => handleEnhancedCompletionResponse('reject')}
                disabled={respondingToCompletion}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Completed Successfully */}
      {session?.status === 'completed' && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-6 rounded-lg mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900">
                  Session Completed Successfully! 🎉
                </h3>
                <p className="text-purple-700 text-sm">
                  Great job! Both participants have completed this skill exchange session.
                </p>
              </div>
            </div>
            
            {/* Show review button only if user hasn't reviewed yet */}
            {!userReview ? (
              <button
                onClick={() => setShowUserReviewModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <User className="h-4 w-4" />
                <span>Review {otherUser?.firstName}</span>
              </button>
            ) : (
              /* Show existing review if already submitted */
              <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-purple-700">Your Review:</span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((starNumber) => (
                      <Star
                        key={starNumber}
                        className={`h-4 w-4 ${
                          starNumber <= userReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">{userReview.rating}/5</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic mb-1">"{userReview.comment}"</p>
                <p className="text-xs text-gray-500">
                  Submitted on {formatDate(userReview.createdAt)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session Statistics Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Works */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{works.length}</div>
            <div className="text-sm text-blue-700">Total Works Submitted</div>
          </div>
          
          {/* Accepted Works */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {works.filter(w => w.acceptanceStatus === 'accepted').length}
            </div>
            <div className="text-sm text-green-700">Accepted Works</div>
          </div>
          
          {/* Rejected Works */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {works.filter(w => w.acceptanceStatus === 'rejected').length}
            </div>
            <div className="text-sm text-red-700">Rejected/Needs Improvement</div>
          </div>
          
          {/* Pending Reviews */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">
              {works.filter(w => w.acceptanceStatus === 'pending').length}
            </div>
            <div className="text-sm text-yellow-700">Pending Review</div>
          </div>
        </div>

        {/* Expected End Date Alert */}
        {session?.status === 'active' && (session?.expectedEndDate || myProgress?.dueDate || otherProgress?.dueDate) && (
          <div className="mb-4">
            {(() => {
              let targetDate;
              
              if (session?.expectedEndDate) {
                targetDate = new Date(session.expectedEndDate);
              } else {
                const dueDates = [];
                if (myProgress?.dueDate) dueDates.push(new Date(myProgress.dueDate));
                if (otherProgress?.dueDate) dueDates.push(new Date(otherProgress.dueDate));
                
                if (dueDates.length === 0) return null;
                targetDate = new Date(Math.min(...dueDates.map(d => d.getTime())));
              }
              
              const today = new Date();
              const isOverdue = today > targetDate;
              const daysUntilDue = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              if (isOverdue) {
                const daysOverdue = Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Session Overdue: {daysOverdue} day{daysOverdue > 1 ? 's' : ''} past expected completion
                      </span>
                    </div>
                  </div>
                );
              } else if (daysUntilDue <= 7) {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        {daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Session Timeline */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-medium text-gray-900 mb-3">Session Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Started</div>
                <div className="text-sm text-gray-600">{formatDate(session.startDate)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                session?.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {session?.status === 'completed' ? 'Completed' : 'Expected End'}
                </div>
                <div className="text-sm text-gray-600">
                  {session?.status === 'completed' 
                    ? (session.completionApprovedAt ? formatDate(session.completionApprovedAt) : (session.updatedAt ? formatDate(session.updatedAt) : 'Recently completed'))
                    : getExpectedEndDate()
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Duration</div>
                <div className="text-sm text-gray-600">
                  {session?.status === 'completed' && (session.completionApprovedAt || session.updatedAt)
                    ? `${Math.ceil((new Date(session.completionApprovedAt || session.updatedAt!).getTime() - new Date(session.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                    : `${Math.ceil((new Date().getTime() - new Date(session.startDate).getTime()) / (1000 * 60 * 60 * 24))} days so far`
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">Session Details</h2>
            {session?.status === 'completed' && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Completed</span>
              </span>
            )}
          </div>
          
          {/* Mark as Complete Button */}
          {session?.status === 'active' && (
            <div className="flex items-center space-x-3">
              {completionStatus.hasRequestedCompletion ? (
                <span className="text-sm text-yellow-600 font-medium bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                  Completion Requested - Waiting for Approval
                </span>
              ) : completionStatus.needsToApprove ? (
                <>
                  <button
                    onClick={() => handleEnhancedCompletionResponse('approve')}
                    disabled={respondingToCompletion}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve & Review</span>
                  </button>
                  <button
                    onClick={() => handleEnhancedCompletionResponse('reject')}
                    disabled={respondingToCompletion}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    <span>Decline</span>
                  </button>
                </>
              ) : completionStatus.canRequestCompletion ? (
                <button
                  onClick={handleEnhancedCompletionRequest}
                  disabled={requestingCompletion || completionRequestLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{(requestingCompletion || completionRequestLoading) ? 'Requesting...' : 'Request Completion'}</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What you're offering */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">You're offering:</h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900">
                {mySkill?.skillTitle || mySkill?.title || 'Skill not available'}
              </h4>
              <div className="text-sm text-blue-700 mt-1">
                <p className="leading-relaxed">{cleanDescription(myDescription)}</p>
                {myDescription && myDescription.length > 200 && (
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-xs mt-1 underline"
                    onClick={() => {
                      showAlert('info', myDescription, 'Full Description');
                    }}
                  >
                    View full description
                  </button>
                )}
              </div>
              {mySkill?.proficiencyLevel && (
                <span className="inline-block mt-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                  {mySkill.proficiencyLevel}
                </span>
              )}
            </div>
          </div>

          {/* What you're receiving */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-gray-900">You're receiving:</h3>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900">
                {otherSkill?.skillTitle || otherSkill?.title || 'Skill not available'}
              </h4>
              <div className="text-sm text-green-700 mt-1">
                <p className="leading-relaxed">{cleanDescription(otherDescription)}</p>
                {otherDescription && otherDescription.length > 200 && (
                  <button 
                    className="text-green-600 hover:text-green-800 text-xs mt-1 underline"
                    onClick={() => {
                      showAlert('info', otherDescription, 'Full Description');
                    }}
                  >
                    View full description
                  </button>
                )}
              </div>
              {otherSkill?.proficiencyLevel && (
                <span className="inline-block mt-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                  {otherSkill.proficiencyLevel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Cancellation Section */}
      {(session?.status === 'active' || session?.status === 'canceled' || cancelRequest) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Session Cancellation</h2>
            <div className="flex items-center space-x-3">
              {session?.status === 'canceled' && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  <XCircle className="h-4 w-4" />
                  <span>Cancelled</span>
                </span>
              )}
              {session?.status === 'active' && !cancelRequest && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Session</span>
                </button>
              )}
            </div>
          </div>

          {loadingCancelRequest ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading cancellation status...</span>
            </div>
          ) : cancelRequest ? (
            <div className="space-y-4">
              {/* Cancellation Request Details */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Cancellation Request</h4>
                    <p className="text-sm text-gray-600">
                      Initiated by {cancelRequest.initiatorId._id === currentUserId ? 'You' : 
                        (cancelRequest.initiatorId.firstName + ' ' + cancelRequest.initiatorId.lastName).trim()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    cancelRequest.resolution === 'canceled' ? 'bg-red-100 text-red-800' :
                    cancelRequest.resolution === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cancelRequest.resolution === 'canceled' ? 'Cancelled' : 
                     cancelRequest.resolution === 'pending' ? 'Pending' : 
                     cancelRequest.resolution}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Reason:</label>
                    <p className="text-sm text-gray-900 mt-1">{cancelRequest.reason}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description:</label>
                    <p className="text-sm text-gray-900 mt-1">{cancelRequest.description}</p>
                  </div>

                  {cancelRequest.evidenceFiles && cancelRequest.evidenceFiles.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Evidence Files:</label>
                      <div className="mt-1 space-y-1">
                        {cancelRequest.evidenceFiles.map((fileUrl: string, index: number) => {
                          // Extract filename from URL for display
                          const getFileNameFromUrl = (url: string) => {
                            try {
                              const urlObj = new URL(url);
                              const pathSegments = urlObj.pathname.split('/').filter(Boolean);
                              return pathSegments.length > 0 ? 
                                decodeURIComponent(pathSegments[pathSegments.length - 1]) : 
                                `Evidence File ${index + 1}`;
                            } catch (error) {
                              return `Evidence File ${index + 1}`;
                            }
                          };

                          return (
                            <button
                              key={index}
                              onClick={() => handleDownloadFile(fileUrl, getFileNameFromUrl(fileUrl))}
                              className="text-blue-600 hover:text-blue-800 text-sm underline block text-left"
                            >
                              {getFileNameFromUrl(fileUrl)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Submitted on {formatDate(cancelRequest.createdAt)}
                  </div>
                </div>
              </div>

              {/* Response Section */}
              {cancelRequest.responseStatus !== 'pending' && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium text-gray-900 mb-3">Response</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        cancelRequest.responseStatus === 'agreed' ? 'bg-green-100 text-green-800' :
                        cancelRequest.responseStatus === 'disputed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cancelRequest.responseStatus === 'agreed' ? 'Agreed' : 
                         cancelRequest.responseStatus === 'disputed' ? 'Disputed' : 
                         cancelRequest.responseStatus}
                      </span>
                    </div>

                    {cancelRequest.responseDescription && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Response:</label>
                        <p className="text-sm text-gray-900 mt-1">{cancelRequest.responseDescription}</p>
                      </div>
                    )}

                    {cancelRequest.workCompletionPercentage !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Work Completion:</label>
                        <p className="text-sm text-gray-900 mt-1">{cancelRequest.workCompletionPercentage}%</p>
                      </div>
                    )}

                    {cancelRequest.responseEvidenceFiles && cancelRequest.responseEvidenceFiles.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Response Evidence:</label>
                        <div className="mt-1 space-y-1">
                          {cancelRequest.responseEvidenceFiles.map((fileUrl: string, index: number) => {
                            // Extract filename from URL for display
                            const getFileNameFromUrl = (url: string) => {
                              try {
                                const urlObj = new URL(url);
                                const pathSegments = urlObj.pathname.split('/').filter(Boolean);
                                return pathSegments.length > 0 ? 
                                  decodeURIComponent(pathSegments[pathSegments.length - 1]) : 
                                  `Response Evidence ${index + 1}`;
                              } catch (error) {
                                return `Response Evidence ${index + 1}`;
                              }
                            };

                            return (
                              <button
                                key={index}
                                onClick={() => handleDownloadFile(fileUrl, getFileNameFromUrl(fileUrl))}
                                className="text-blue-600 hover:text-blue-800 text-sm underline block text-left"
                              >
                                {getFileNameFromUrl(fileUrl)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Responded on {formatDate(cancelRequest.responseDate)}
                    </div>
                  </div>
                </div>
              )}

              {/* Final Note Section */}
              {cancelRequest.finalNote && (
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <h4 className="font-medium text-gray-900 mb-3">Final Decision</h4>
                  <p className="text-sm text-gray-900">{cancelRequest.finalNote}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    Finalized on {formatDate(cancelRequest.resolvedDate)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {session?.status === 'active' && cancelRequest.resolution === 'pending' && (
                <div className="flex items-center justify-end space-x-3">
                  {cancelRequest.initiatorId._id !== currentUserId && cancelRequest.responseStatus === 'pending' && (
                    <>
                      {/* Other user can respond to cancellation */}
                      <button
                        onClick={() => setShowCancelResponseModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Respond to Cancellation
                      </button>
                    </>
                  )}
                  
                  {cancelRequest.initiatorId._id === currentUserId && cancelRequest.responseStatus === 'disputed' && (
                    <>
                      {/* Initiator can finalize after dispute */}
                      <button
                        onClick={() => setShowCancelFinalizeModal(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Finalize Cancellation
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : session?.status === 'active' && !cancelRequest && (
            <div className="text-center py-6">
              <div className="text-gray-400 mb-3">
                <XCircle className="mx-auto h-8 w-8" />
              </div>
              <p className="text-gray-600 mb-4">
                No cancellation requests for this session.
              </p>
              <p className="text-sm text-gray-500">
                If you need to cancel this session, use the "Cancel Session" button above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress Summary */}
      {(myProgress || otherProgress) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progress Summary</h2>
            <button
              onClick={() => setActiveTabHook('progress')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myProgress && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Your Progress</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm font-semibold">{myProgress.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${myProgress.completionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      myProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                      myProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      myProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {myProgress.status.replace('_', ' ')}
                    </span>
                    {myProgress.notes && (
                      <span className="text-xs text-gray-500">Has notes</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {otherProgress && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">{getOtherUserName()}'s Progress</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm font-semibold">{otherProgress.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${otherProgress.completionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      otherProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                      otherProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      otherProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {otherProgress.status.replace('_', ' ')}
                    </span>
                    {otherProgress.notes && (
                      <span className="text-xs text-gray-500">Has notes</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {myProgress && otherProgress ? Math.round((myProgress.completionPercentage + otherProgress.completionPercentage) / 2) : (myProgress?.completionPercentage || otherProgress?.completionPercentage || 0)}%
                </div>
                <div className="text-xs text-gray-500">Overall Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{works.filter(w => w.acceptanceStatus === 'accepted').length}</div>
                <div className="text-xs text-gray-500">Accepted Works</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{works.filter(w => w.acceptanceStatus === 'pending').length}</div>
                <div className="text-xs text-gray-500">Pending Reviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">{works.length}</div>
                <div className="text-xs text-gray-500">Total Submissions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Section for completed sessions */}
      {session?.status === 'completed' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Session Reviews</h2>
            <span className="text-sm text-gray-500">
              Share your experience with this skill exchange
            </span>
          </div>
          
          {loadingReviews ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading reviews...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Your Review */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>Your Review of {getOtherUserName()}</span>
                </h3>
                {userReview ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xl ${
                              star <= userReview.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {userReview.rating}/5
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{userReview.comment}"</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted on {formatDate(userReview.createdAt)}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-3">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        You haven't reviewed {getOtherUserName()} yet
                      </p>
                      <button
                        onClick={() => setShowReviewModalHook(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Write Review
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Review from Other User */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span>Review from {getOtherUserName()}</span>
                </h3>
                {receivedReview ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xl ${
                              star <= receivedReview.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {receivedReview.rating}/5
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{receivedReview.comment}"</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted on {formatDate(receivedReview.createdAt)}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-3">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getOtherUserName()} hasn't reviewed this session yet
                      </p>
                      <p className="text-xs text-gray-500">
                        They will be able to submit their review once they visit the session page
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <XCircle className="w-6 h-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Cancel Session
                </h3>
              </div>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <CancelSessionForm 
              onSubmit={handleCancelSession}
              onCancel={() => setShowCancelModal(false)}
            />
          </div>
        </div>
      )}

      {/* Session Cancellation Response Modal */}
      {showCancelResponseModal && cancelRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Respond to Cancellation
                </h3>
              </div>
              <button 
                onClick={() => setShowCancelResponseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <CancelResponseForm 
              onSubmit={handleCancelResponse}
              onCancel={() => setShowCancelResponseModal(false)}
              initiatorName={getUserName(cancelRequest.initiatorId)}
              reason={cancelRequest.reason}
              description={cancelRequest.description}
            />
          </div>
        </div>
      )}

      {/* Completion Request Modal */}
      {showCompletionRequestModal && (
        <CompletionRequestModal
          isOpen={showCompletionRequestModal}
          onClose={() => setShowCompletionRequestModal(false)}
          onConfirm={handleConfirmCompletionRequest}
          session={session}
          currentUserId={currentUserId}
          loading={completionRequestLoading}
        />
      )}

      {/* User Review Modal */}
      {showUserReviewModal && (
        <UserReviewModal
          isOpen={showUserReviewModal}
          onClose={() => setShowUserReviewModal(false)}
          onReviewSubmitted={handleReviewSubmitted}
          session={session}
          currentUserId={currentUserId}
          otherUser={otherUser}
        />
      )}

    </div>
  );
}
