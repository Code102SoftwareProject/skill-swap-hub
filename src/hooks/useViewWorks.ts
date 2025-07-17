import { useState, useCallback, useEffect } from 'react';
import viewWorksService from '../services/viewWorksService';

export interface UseViewWorksProps {
  session: any;
  currentUserId: string;
  sessionId: string;
  onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
  onWorksUpdate?: () => void; // Callback to refresh works data
  otherUserDetails?: any;
}

export function useViewWorks({
  session,
  currentUserId,
  sessionId,
  onAlert,
  onWorksUpdate,
  otherUserDetails,
}: UseViewWorksProps) {
  // State
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingWorkId, setProcessingWorkId] = useState<string | null>(null); // Track which work is being processed

  // Modal states for work review
  const [reviewingWork, setReviewingWork] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject' | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false); // Loading state for review submission

  // Utility functions
  const formatDate = useCallback((dateString: string) => {
    return viewWorksService.formatDate(dateString);
  }, []);

  const getUserName = useCallback((user: any) => {
    return viewWorksService.getUserName(user, currentUserId, otherUserDetails);
  }, [currentUserId, otherUserDetails]);

  // Fetch works
  const fetchWorks = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const data = await viewWorksService.fetchWorks(sessionId);
      
      if (data.success) {
        setWorks(data.works);
      }
    } catch (error) {
      console.error('Error fetching works:', error);
      onAlert('error', 'Failed to fetch works');
    } finally {
      setLoading(false);
    }
  }, [sessionId, onAlert]);

  // Check for pending work reviews when works change
  useEffect(() => {
    if (works.length > 0 && currentUserId && sessionId) {
      const pendingReviews = works.filter((work: any) => 
        work.receiveUser._id === currentUserId && work.acceptanceStatus === 'pending'
      );
      
      // Only send notification if there are pending reviews (not on initial load)
      if (pendingReviews.length > 0) {
        // Small delay to avoid sending notifications on initial page load
        const timeoutId = setTimeout(async () => {
          try {
            await viewWorksService.sendNotification(
              currentUserId,
              14, // WORK_REVIEW_PENDING
              `You have ${pendingReviews.length} work submission${pendingReviews.length > 1 ? 's' : ''} waiting for your review`,
              `/session/${sessionId}`
            );
          } catch (error) {
            console.error('Error sending notification:', error);
          }
        }, 2000); // 2 second delay

        return () => clearTimeout(timeoutId);
      }
    }
  }, [works, currentUserId, sessionId]);

  // Handle work review
  const handleWorkReview = useCallback(async (workId: string, action: 'accept' | 'reject', message: string) => {
    // Prevent multiple submissions
    if (submittingReview || processingWorkId) return;
    
    try {
      setSubmittingReview(true);
      setProcessingWorkId(workId);
      
      const data = await viewWorksService.reviewWork(workId, action, currentUserId, message);
      
      if (data.success) {
        // Optimistically update the UI immediately
        setWorks(prevWorks => 
          prevWorks.map(work => 
            work._id === workId 
              ? { 
                  ...work, 
                  acceptanceStatus: action === 'accept' ? 'accepted' : 'rejected',
                  remark: action === 'accept' ? message : work.remark,
                  rejectionReason: action === 'reject' ? message : work.rejectionReason
                }
              : work
          )
        );

        // Show success message immediately with action confirmation
        onAlert('success', `Work ${action === 'accept' ? 'accepted' : 'rejected'}! ${action === 'accept' ? 'The provider has been notified.' : 'Feedback has been sent to the provider.'}`);
        
        // Clear modal state immediately
        setReviewingWork(null);
        setReviewAction(null);
        setReviewMessage('');
        
        // Send notification in background (non-blocking)
        const work = works.find(w => w._id === workId);
        if (work) {
          viewWorksService.sendNotification(
            work.provideUser._id,
            action === 'accept' ? 11 : 12, // WORK_ACCEPTED or WORK_REJECTED
            action === 'accept' 
              ? `Your work submission for session "${session?.title || 'Skill Exchange'}" has been accepted!`
              : `Your work submission for session "${session?.title || 'Skill Exchange'}" needs improvement. Please check the feedback and resubmit.`,
            `/session/${sessionId}`
          ).catch(error => console.error('Notification error:', error));
        }
        
        // Refresh data in background if callback provided
        if (onWorksUpdate) {
          setTimeout(() => onWorksUpdate(), 500);
        }
      } else {
        onAlert('error', data.message || `Failed to ${action} work`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing work:`, error);
      onAlert('error', error.message || `Failed to ${action} work`);
    } finally {
      setSubmittingReview(false);
      setProcessingWorkId(null);
    }
  }, [currentUserId, works, session, sessionId, onAlert, onWorksUpdate, submittingReview, processingWorkId]);

  // Handle file download
  const handleDownloadFile = useCallback(async (fileURL: string, fileName?: string) => {
    try {
      await viewWorksService.downloadFile(fileURL, fileName);
    } catch (error: any) {
      console.error('Download error:', error);
      onAlert('error', 'Failed to download file');
    }
  }, [onAlert]);

  // Modal management functions
  const openReviewModal = useCallback((workId: string, action: 'accept' | 'reject') => {
    setReviewingWork(workId);
    setReviewAction(action);
    setReviewMessage('');
  }, []);

  const closeReviewModal = useCallback(() => {
    setReviewingWork(null);
    setReviewAction(null);
    setReviewMessage('');
  }, []);

  const submitReview = useCallback(() => {
    if (!reviewingWork || !reviewAction || submittingReview) return;
    
    if (reviewAction === 'reject' && !reviewMessage.trim()) {
      onAlert('warning', 'Please provide improvement request details');
      return;
    }
    
    handleWorkReview(reviewingWork, reviewAction, reviewMessage);
  }, [reviewingWork, reviewAction, reviewMessage, handleWorkReview, onAlert, submittingReview]);

  // Effects
  useEffect(() => {
    if (sessionId) {
      fetchWorks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]); // Only depend on sessionId to prevent infinite loop

  return {
    // Data
    works,
    loading,
    
    // Processing states
    processingWorkId,
    submittingReview,
    
    // Modal states
    reviewingWork,
    reviewAction,
    reviewMessage,
    setReviewMessage,
    
    // Utility functions
    formatDate,
    getUserName,
    
    // Actions
    fetchWorks,
    handleWorkReview,
    handleDownloadFile,
    openReviewModal,
    closeReviewModal,
    submitReview,
    
    // Modal setters for backward compatibility
    setReviewingWork,
    setReviewAction,
  };
}
