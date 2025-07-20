import { useState, useEffect, useCallback } from 'react';
import overviewService from '../services/overviewService';

export interface UseOverviewProps {
  session: any;
  currentUserId: string;
  token?: string; // Add JWT token for authentication
  onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
  onTabChange: (tab: string) => void;
  onSessionUpdate?: () => void; // Callback to refresh session data
  works: any[];
  myProgress: any;
  otherProgress: any;
  user: any;
  otherUserDetails: any;
}

export function useOverview({
  session,
  currentUserId,
  token, // Add token parameter
  onAlert,
  onTabChange,
  onSessionUpdate,
  works,
  myProgress,
  otherProgress,
  user,
  otherUserDetails,
}: UseOverviewProps) {
  // State
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReview, setUserReview] = useState<any>(null);
  const [receivedReview, setReceivedReview] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [cancelRequest, setCancelRequest] = useState<any>(null);
  const [loadingCancelRequest, setLoadingCancelRequest] = useState(true);
  const [requestingCompletion, setRequestingCompletion] = useState(false);
  const [respondingToCompletion, setRespondingToCompletion] = useState(false);

  // Modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelResponseModal, setShowCancelResponseModal] = useState(false);
  const [showCancelFinalizeModal, setShowCancelFinalizeModal] = useState(false);

  // Computed values
  const completionStatus = overviewService.getCompletionStatus(session, currentUserId);
  const otherUserName = overviewService.getOtherUserName(session, currentUserId);
  const expectedEndDate = overviewService.getExpectedEndDate(session, myProgress, otherProgress);

  // Utility functions
  const formatDate = useCallback((dateString: string) => {
    return overviewService.formatDate(dateString);
  }, []);

  const cleanDescription = useCallback((description: string) => {
    return overviewService.cleanDescription(description);
  }, []);

  const getUserName = useCallback((user: any) => {
    return overviewService.getUserName(user);
  }, []);

  const getOtherUserName = useCallback(() => {
    return otherUserName;
  }, [otherUserName]);

  const getExpectedEndDate = useCallback(() => {
    return expectedEndDate;
  }, [expectedEndDate]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    if (!session?._id) return;

    try {
      setLoadingReviews(true);
      const reviewsData = await overviewService.fetchReviews(session._id, token);
      setReviews(reviewsData.reviews || []);
      
      // Find user's review and received review
      const userReviewData = reviewsData.reviews?.find((r: any) => r.reviewerId._id === currentUserId);
      const receivedReviewData = reviewsData.reviews?.find((r: any) => r.reviewerId._id !== currentUserId);
      
      setUserReview(userReviewData || null);
      setReceivedReview(receivedReviewData || null);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      onAlert('error', 'Failed to fetch reviews');
    } finally {
      setLoadingReviews(false);
    }
  }, [session?._id, currentUserId, onAlert, token]);

  // Fetch cancel request
  const fetchCancelRequest = useCallback(async () => {
    if (!session?._id) return;

    try {
      setLoadingCancelRequest(true);
      const cancelData = await overviewService.fetchCancelRequest(session._id, token);
      setCancelRequest(cancelData || null);
    } catch (error) {
      console.error('Error fetching cancel request:', error);
      // Don't show error for cancel request as it might not exist
    } finally {
      setLoadingCancelRequest(false);
    }
  }, [session?._id, token]);

  // Handle completion request
  const handleRequestCompletion = useCallback(async () => {
    if (!session?._id || !currentUserId) return;

    try {
      setRequestingCompletion(true);
      await overviewService.requestCompletion(session._id, currentUserId, token);
      onAlert('success', 'Completion request sent successfully');
      
      // Refresh session data
      if (onSessionUpdate) {
        onSessionUpdate();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error requesting completion:', error);
      onAlert('error', error.message || 'Failed to request completion');
    } finally {
      setRequestingCompletion(false);
    }
  }, [session?._id, currentUserId, onAlert, onSessionUpdate, token]);

  // Handle completion response
  const handleCompletionResponse = useCallback(async (action: 'approve' | 'reject', rejectionReason?: string) => {
    if (!session?._id || !currentUserId) return;

    try {
      setRespondingToCompletion(true);
      await overviewService.respondToCompletion(session._id, currentUserId, action, rejectionReason, token);
      
      const message = action === 'approve' 
        ? 'Session marked as completed successfully!' 
        : 'Completion request rejected';
      
      onAlert('success', message);
      
      // Refresh session data
      if (onSessionUpdate) {
        onSessionUpdate();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Error responding to completion:', error);
      onAlert('error', error.message || 'Failed to respond to completion');
    } finally {
      setRespondingToCompletion(false);
    }
  }, [session?._id, currentUserId, onAlert, onSessionUpdate, token]);

  // Handle file download
  const handleDownloadFile = useCallback(async (fileURL: string, fileName?: string) => {
    try {
      await overviewService.downloadFile(fileURL, token, fileName);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      onAlert('error', 'Failed to download file');
    }
  }, [onAlert, token]);

  // Handle tab change
  const setActiveTab = useCallback((tab: string) => {
    onTabChange(tab);
  }, [onTabChange]);

  // Handle session cancellation
  const handleCancelSession = useCallback(async (reason: string, description: string, evidenceFiles: string[] = []) => {
    if (!session?._id || !currentUserId) return;

    try {
      await overviewService.cancelSession(session._id, currentUserId, reason, description, token, evidenceFiles);
      onAlert('success', 'Cancellation request submitted successfully');
      setShowCancelModal(false);
      
      // Refresh cancel request data
      fetchCancelRequest();
    } catch (error: any) {
      console.error('Error canceling session:', error);
      onAlert('error', error.message || 'Failed to submit cancellation request');
    }
  }, [session?._id, currentUserId, onAlert, fetchCancelRequest, token]);

  // Handle cancellation response
  const handleCancelResponse = useCallback(async (action: 'agree' | 'dispute', responseDescription: string, workCompletionPercentage?: number) => {
    if (!session?._id || !currentUserId) return;

    try {
      await overviewService.respondToCancellation(
        session._id, 
        currentUserId, 
        action, 
        responseDescription, 
        token,
        workCompletionPercentage
      );
      onAlert('success', `Cancellation response submitted successfully`);
      setShowCancelResponseModal(false);
      
      // Refresh cancel request data
      fetchCancelRequest();
      
      // If the action was 'agree', the session status should change to 'canceled'
      // So we need to refresh the session data
      if (action === 'agree' && onSessionUpdate) {
        // Add a small delay to ensure backend has updated
        setTimeout(() => {
          onSessionUpdate();
        }, 1500); // Increased timeout to 1.5 seconds
      }
    } catch (error: any) {
      console.error('Error responding to cancellation:', error);
      onAlert('error', error.message || 'Failed to respond to cancellation');
    }
  }, [session?._id, currentUserId, onAlert, fetchCancelRequest, onSessionUpdate, token]);

  // Effects
  useEffect(() => {
    if (session?._id) {
      fetchReviews();
      fetchCancelRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?._id]); // Only depend on session._id to prevent infinite loop

  return {
    // Data
    reviews,
    userReview,
    receivedReview,
    loadingReviews,
    cancelRequest,
    loadingCancelRequest,
    completionStatus,
    
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
    setActiveTab,
    
    // Refresh functions
    fetchReviews,
    fetchCancelRequest
  };
}
