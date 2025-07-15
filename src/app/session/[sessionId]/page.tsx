"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, BookOpen, FileText, Upload, CheckCircle, Clock, AlertCircle, Flag, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { getSessionCompletionStatus, type CompletionStatus } from '@/utils/sessionCompletion';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

// Import tab components
import OverviewTab from '@/components/sessionTabs/OverviewTab';
import SubmitWorkTab from '@/components/sessionTabs/SubmitWorkTab';
import ViewWorksTab from '@/components/sessionTabs/ViewWorksTab';
import ProgressTab from '@/components/sessionTabs/ProgressTab';
import ReportTab from '@/components/sessionTabs/ReportTab';

interface Session {
  _id: string;
  user1Id: any;
  user2Id: any;
  skill1Id: any;
  skill2Id: any;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  expectedEndDate?: string;
  isAccepted: boolean;
  status: string;
  progress1?: any;
  progress2?: any;
  completionApprovedAt?: string;
  completionRequestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkFile {
  fileName: string;
  fileURL: string;
  fileTitle: string;
  uploadedAt: string;
}

interface Work {
  _id: string;
  session: string;
  provideUser: any;
  receiveUser: any;
  workURL: string; // Keep for backwards compatibility
  workFiles: WorkFile[]; // New field for multiple files
  workDescription: string;
  provideDate: string;
  acceptanceStatus: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  rating?: number;
  remark?: string;
}

interface SessionProgress {
  _id: string;
  userId: any; // Can be string or populated user object
  sessionId: string;
  startDate: string;
  dueDate: string;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  notes: string;
}

export default function SessionWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.sessionId as string;
  const currentUserId = user?._id
  
  const [session, setSession] = useState<Session | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [myProgress, setMyProgress] = useState<SessionProgress | null>(null);
  const [otherProgress, setOtherProgress] = useState<SessionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'submit-work' | 'view-works' | 'progress' | 'report'>('overview');
  const [otherUserDetails, setOtherUserDetails] = useState<any>(null);

  // Completion status from SessionCompletion API
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    canRequestCompletion: true,
    hasRequestedCompletion: false,
    needsToApprove: false,
    wasRejected: false,
    isCompleted: false,
    pendingRequests: []
  });

  // Submit work form state
  const [workDescription, setWorkDescription] = useState('');
  const [workFiles, setWorkFiles] = useState<{ file: File; title: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Work review state
  const [reviewingWork, setReviewingWork] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject' | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');

  // Progress update state
  const [editingProgress, setEditingProgress] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [progressNotes, setProgressNotes] = useState('');
  const [progressStatus, setProgressStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'abandoned'>('not_started');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Report form state
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [existingReports, setExistingReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  // Completion state
  const [requestingCompletion, setRequestingCompletion] = useState(false);
  const [respondingToCompletion, setRespondingToCompletion] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Review state
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReview, setUserReview] = useState<any>(null);
  const [receivedReview, setReceivedReview] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Cancellation state
  const [cancelRequest, setCancelRequest] = useState<any>(null);
  const [loadingCancelRequest, setLoadingCancelRequest] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelResponseModal, setShowCancelResponseModal] = useState(false);
  const [showCancelFinalizeModal, setShowCancelFinalizeModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDescription, setCancelDescription] = useState('');
  const [cancelFiles, setCancelFiles] = useState<File[]>([]);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [cancelResponse, setCancelResponse] = useState<'agree' | 'dispute'>('agree');
  const [cancelResponseDescription, setCancelResponseDescription] = useState('');
  const [cancelResponseFiles, setCancelResponseFiles] = useState<File[]>([]);
  const [workCompletionPercentage, setWorkCompletionPercentage] = useState(50);
  const [submittingCancelResponse, setSubmittingCancelResponse] = useState(false);
  const [cancelFinalNote, setCancelFinalNote] = useState('');
  const [submittingCancelFinalize, setSubmittingCancelFinalize] = useState(false);

  // Alert and confirmation states
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    confirmText?: string;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Helper function to send notifications
  const sendNotification = async (userId: string, typeno: number, description: string, targetDestination?: string) => {
    try {
      await fetch('/api/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          typeno,
          description,
          targetDestination,
          broadcast: false
        }),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw error - notifications should not break the main functionality
    }
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
    type?: 'danger' | 'warning' | 'info' | 'success',
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

  useEffect(() => {
    // Get current user ID - this should be from auth context in real app
    // For now, we'll try to get it from the session data
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  useEffect(() => {
    if (currentUserId && sessionId) {
      fetchWorks();
      fetchProgress();
      fetchReports();
      fetchCompletionStatus();
      fetchReviews();
    }
  }, [currentUserId, sessionId]);

  useEffect(() => {
    if (session && currentUserId) {
      fetchOtherUserDetails();
    }
  }, [session, currentUserId]);

  // Fetch reviews when session status changes to completed
  useEffect(() => {
    if (session?.status === 'completed' && currentUserId && sessionId) {
      fetchReviews();
    }
  }, [session?.status, currentUserId, sessionId]);

  const fetchOtherUserDetails = async () => {
    if (!session) return;
    
    try {
      const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
      const response = await fetch(`/api/users/profile?id=${otherUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setOtherUserDetails(data.user);
      }
    } catch (error) {
      console.error('Error fetching other user details:', error);
    }
  };

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Session data loaded:', data.session);
        console.log('Skill 1:', data.session.skill1Id);
        console.log('Skill 2:', data.session.skill2Id);
        console.log('Description 1:', data.session.descriptionOfService1);
        console.log('Description 2:', data.session.descriptionOfService2);
        setSession(data.session);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchWorks = async () => {
    try {
      const response = await fetch(`/api/work/session/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setWorks(data.works);
        
        // Check for pending work reviews and send reminder notification
        if (currentUserId) {
          const pendingReviews = data.works.filter((work: Work) => 
            work.receiveUser._id === currentUserId && work.acceptanceStatus === 'pending'
          );
          
          // If there are pending reviews and this is not the initial load, send reminder
          if (pendingReviews.length > 0 && works.length > 0) {
            // Only send reminder if we're not on the initial page load
            const oldPendingCount = works.filter(w => 
              w.receiveUser._id === currentUserId && w.acceptanceStatus === 'pending'
            ).length;
            
            if (pendingReviews.length > oldPendingCount) {
              // New pending work added, send notification to current user as reminder
              await sendNotification(
                currentUserId,
                14, // WORK_REVIEW_PENDING
                `You have ${pendingReviews.length} work submission${pendingReviews.length > 1 ? 's' : ''} waiting for your review`,
                `/session/${sessionId}`
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching works:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/session-progress/${sessionId}`);
      const data = await response.json();
      
      if (data.success && currentUserId) {
        console.log('Progress data:', data.progress);
        console.log('Current user ID:', currentUserId);
        
        // Find my progress and other user's progress
        // Handle both string and populated user object cases
        const myProg = data.progress.find((p: SessionProgress) => {
          const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
          return progUserId.toString() === currentUserId.toString();
        });
        const otherProg = data.progress.find((p: SessionProgress) => {
          const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
          return progUserId.toString() !== currentUserId.toString();
        });
        
        console.log('My progress:', myProg);
        console.log('Other progress:', otherProg);
        
        setMyProgress(myProg || null);
        setOtherProgress(otherProg || null);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!currentUserId || !sessionId) return;
    
    setLoadingReports(true);
    try {
      const response = await fetch(`/api/session/report/${sessionId}?userId=${currentUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setExistingReports(data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchCompletionStatus = async () => {
    if (!currentUserId || !sessionId) return;
    
    try {
      const status = await getSessionCompletionStatus(sessionId, currentUserId);
      setCompletionStatus(status);
    } catch (error) {
      console.error('Error fetching completion status:', error);
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', `sessions/${sessionId}/works`);

    try {
      const response = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        return data.url;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workDescription.trim()) {
      showAlert('warning', 'Please provide a work description');
      return;
    }

    // Validate file count
    if (workFiles.length > 5) {
      showAlert('warning', 'Maximum 5 files allowed per submission');
      return;
    }

    // Validate file sizes (100MB each)
    const maxSize = 100 * 1024 * 1024; // 100MB
    for (const { file } of workFiles) {
      if (file.size > maxSize) {
        showAlert('warning', `File "${file.name}" exceeds 100MB limit`);
        return;
      }
    }

    setUploading(true);
    
    try {
      const uploadedFiles: WorkFile[] = [];
      
      // Upload each file if any
      for (const { file, title } of workFiles) {
        const uploadedUrl = await handleFileUpload(file);
        if (!uploadedUrl) {
          showAlert('error', `Failed to upload file: ${file.name}`);
          setUploading(false);
          return;
        }
        
        uploadedFiles.push({
          fileName: file.name,
          fileURL: uploadedUrl,
          fileTitle: title.trim() || file.name.split('.').slice(0, -1).join('.') || 'Uploaded File',
          uploadedAt: new Date().toISOString()
        });
      }

      if (!session || !currentUserId) {
        showAlert('error', 'Session or user information not available');
        setUploading(false);
        return;
      }

      const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;

      const response = await fetch('/api/work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          provideUser: currentUserId,
          receiveUser: otherUserId,
          workURL: uploadedFiles.length > 0 ? uploadedFiles[0].fileURL : 'text-only', // Keep for backwards compatibility
          workFiles: uploadedFiles,
          workDescription,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Send notification to the other user about work submission
        const otherUserName = getOtherUserName();
        await sendNotification(
          otherUserId,
          11, // WORK_SUBMITTED
          `${user?.firstName || 'Someone'} submitted work in your session: "${workDescription.substring(0, 50)}${workDescription.length > 50 ? '...' : ''}"`,
          `/session/${sessionId}`
        );

        showAlert('success', 'Work submitted successfully!');
        setWorkDescription('');
        setWorkFiles([]);
        fetchWorks(); // Refresh works list
        setActiveTab('view-works');
      } else {
        showAlert('error', data.message || 'Failed to submit work');
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      showAlert('error', 'Failed to submit work');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownloadFile = async (fileURL: string, fileName?: string) => {
    try {
      const response = await fetch(`/api/file/retrieve?fileUrl=${encodeURIComponent(fileURL)}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Try to get filename from content-disposition header or use provided name
      const contentDisposition = response.headers.get('content-disposition');
      let downloadFileName = fileName || 'attachment';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          downloadFileName = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      showAlert('error', 'Failed to download file');
    }
  };

  const handleWorkReview = async (workId: string, action: 'accept' | 'reject', message: string) => {
    try {
      const response = await fetch(`/api/work/${workId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          userId: currentUserId,
          rejectionReason: action === 'reject' ? message : undefined,
          remark: action === 'accept' ? message : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Find the work to get provider details
        const work = works.find(w => w._id === workId);
        if (work) {
          const providerUserId = work.provideUser._id;
          const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
          
          if (action === 'accept') {
            // Send WORK_ACCEPTED notification
            await sendNotification(
              providerUserId,
              12, // WORK_ACCEPTED
              `${currentUserName} accepted your work submission${message ? ': "' + message.substring(0, 50) + '"' : ''}`,
              `/session/${sessionId}`
            );
          } else {
            // Send WORK_REJECTED notification
            await sendNotification(
              providerUserId,
              13, // WORK_REJECTED
              `${currentUserName} requested improvements to your work${message ? ': "' + message.substring(0, 50) + '"' : ''}`,
              `/session/${sessionId}`
            );
          }
        }

        showAlert('success', `Work ${action}ed successfully!`);
        setReviewingWork(null);
        setReviewAction(null);
        setReviewMessage('');
        fetchWorks(); // Refresh works list
      } else {
        showAlert('error', data.message || `Failed to ${action} work`);
      }
    } catch (error) {
      console.error(`Error ${action}ing work:`, error);
      showAlert('error', `Failed to ${action} work`);
    }
  };

  const handleProgressUpdate = async () => {
    if (!currentUserId) {
      showAlert('error', 'User authentication required');
      return;
    }

    if (newProgress < 0 || newProgress > 100) {
      showAlert('warning', 'Progress must be between 0 and 100');
      return;
    }

    setUpdatingProgress(true);
    
    try {
      const response = await fetch(`/api/session-progress/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          completionPercentage: newProgress,
          status: progressStatus,
          notes: progressNotes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Send progress update notification to other user
        if (session) {
          const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
          const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
          
          await sendNotification(
            otherUserId,
            15, // PROGRESS_UPDATED
            `${currentUserName} updated their progress to ${newProgress}% (${progressStatus.replace('_', ' ')})`,
            `/session/${sessionId}`
          );

          // Check for milestones and send milestone notification
          if (newProgress === 50 || newProgress === 100) {
            await sendNotification(
              otherUserId,
              16, // PROGRESS_MILESTONE
              `${currentUserName} reached ${newProgress}% completion milestone!`,
              `/session/${sessionId}`
            );
          }
        }

        showAlert('success', 'Progress updated successfully!');
        setEditingProgress(false);
        setProgressNotes('');
        await fetchProgress(); // Refresh progress data
        
        // Check if both users have completed after this update
        if (newProgress === 100) {
          // Fetch fresh progress data to check if both are at 100%
          setTimeout(async () => {
            try {
              const progressResponse = await fetch(`/api/session-progress/${sessionId}`);
              const progressData = await progressResponse.json();
              
              if (progressData.success && session) {
                const myFreshProgress = progressData.progress.find((p: SessionProgress) => {
                  const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
                  return progUserId.toString() === currentUserId.toString();
                });
                const otherFreshProgress = progressData.progress.find((p: SessionProgress) => {
                  const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
                  return progUserId.toString() !== currentUserId.toString();
                });
                
                if (myFreshProgress?.completionPercentage === 100 && otherFreshProgress?.completionPercentage === 100) {
                  // Both users completed - send completion notifications
                  const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
                  const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
                  
                  await sendNotification(
                    otherUserId,
                    22, // SESSION_COMPLETED
                    `🎉 Session completed! Both you and ${currentUserName} have reached 100% completion!`,
                    `/session/${sessionId}`
                  );
                  
                  await sendNotification(
                    currentUserId,
                    22, // SESSION_COMPLETED
                    `🎉 Congratulations! You and ${getOtherUserName()} have successfully completed this session!`,
                    `/session/${sessionId}`
                  );
                }
              }
            } catch (error) {
              console.error('Error checking session completion:', error);
            }
          }, 1000); // Small delay to ensure progress is saved
        }
      } else {
        showAlert('error', data.message || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      showAlert('error', 'Failed to update progress');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const openProgressEditor = () => {
    setNewProgress(myProgress?.completionPercentage || 0);
    setProgressStatus(myProgress?.status || 'not_started');
    setProgressNotes(myProgress?.notes || '');
    setEditingProgress(true);
  };

  // Auto-update status based on progress percentage
  const updateStatusBasedOnProgress = (progress: number) => {
    if (progress === 0) {
      setProgressStatus('not_started');
    } else if (progress === 100) {
      setProgressStatus('completed');
    } else if (progress > 0) {
      setProgressStatus('in_progress');
    }
  };

  // Session completion handlers
  const handleRequestCompletion = async () => {
    if (!currentUserId || !sessionId) {
      showAlert('error', 'Session or user information not available');
      return;
    }

    showConfirmation(
      'Request Session Completion',
      'Are you sure you want to request session completion? This will notify the other participant for approval.',
      async () => {
        setRequestingCompletion(true);
        
        try {
          const response = await fetch('/api/session/completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              userId: currentUserId,
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            // Send notification to other user
            if (session) {
              const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
              const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
              
              await sendNotification(
                otherUserId,
                18, // SESSION_COMPLETION_REQUESTED (you may need to add this notification type)
                `${currentUserName} has requested to complete your skill exchange session. Please review and approve if you agree.`,
                `/session/${sessionId}`
              );
            }

            showAlert('success', 'Completion request sent successfully! Waiting for approval from the other participant.');
            fetchSessionData(); // Refresh session to show completion request
            fetchCompletionStatus(); // Refresh completion status
          } else {
            showAlert('error', data.message || 'Failed to request completion');
          }
        } catch (error) {
          console.error('Error requesting completion:', error);
          showAlert('error', 'Failed to request completion');
        } finally {
          setRequestingCompletion(false);
        }
      },
      'warning'
    );
  };

  const handleCompletionResponse = async (action: 'approve' | 'reject', providedRejectionReason?: string) => {
    if (!currentUserId || !sessionId) {
      showAlert('error', 'Session or user information not available');
      return;
    }

    // For rejection, show modal to collect reason if not provided
    if (action === 'reject' && !providedRejectionReason) {
      setShowRejectionModal(true);
      return;
    }

    const confirmMessage = action === 'approve' 
      ? 'Are you sure you want to approve session completion? This will mark the session as completed.'
      : 'Are you sure you want to reject the completion request?';

    showConfirmation(
      action === 'approve' ? 'Approve Session Completion' : 'Reject Completion Request',
      confirmMessage,
      async () => {
        setRespondingToCompletion(true);
        
        try {
          const requestBody: any = {
            sessionId,
            userId: currentUserId,
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
            console.log('Completion response successful:', data);
            
            // Send notification to the other user about completion response
            // TODO: Update this to work with new SessionCompletion API
            // For now, we'll skip the notification to avoid errors
            
            showAlert(action === 'approve' ? 'success' : 'info', action === 'approve' ? 'Session completed successfully!' : 'Completion request rejected');
            console.log('About to refresh session data...');
            await fetchSessionData(); // Refresh session data
            await fetchCompletionStatus(); // Refresh completion status
            console.log('Session data refreshed');
            
            // Close modal if it was open
            if (action === 'reject') {
              setShowRejectionModal(false);
              setRejectionReason('');
            }
          } else {
            showAlert('error', data.message || `Failed to ${action} completion`);
          }
        } catch (error) {
          console.error(`Error ${action}ing completion:`, error);
          showAlert('error', `Failed to ${action} completion`);
        } finally {
          setRespondingToCompletion(false);
        }
      },
      action === 'approve' ? 'success' : 'warning'
    );
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      showAlert('warning', 'Please provide a reason for rejection');
      return;
    }
    handleCompletionResponse('reject', rejectionReason);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportReason || !reportDescription.trim()) {
      showAlert('warning', 'Please provide a reason and description for the report');
      return;
    }

    if (!session || !currentUserId) {
      showAlert('error', 'Session or user information not available');
      return;
    }

    setSubmittingReport(true);
    
    try {
      // Upload evidence files if any
      const evidenceFileUrls: string[] = [];
      for (const file of reportFiles) {
        const uploadedUrl = await handleFileUpload(file);
        if (uploadedUrl) {
          evidenceFileUrls.push(uploadedUrl);
        }
      }

      const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;

      const response = await fetch('/api/session/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          reportedBy: currentUserId,
          reportedUser: otherUserId,
          reason: reportReason,
          description: reportDescription,
          evidenceFiles: evidenceFileUrls,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Send notification to the reported user
        const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
        await sendNotification(
          otherUserId,
          17, // REPORT_SUBMITTED
          `A report has been submitted regarding your session behavior. Our admin team will review this matter.`,
          `/session/${sessionId}`
        );

        showAlert('success', 'Report submitted successfully! Our team will review it shortly.');
        setReportReason('');
        setReportDescription('');
        setReportFiles([]);
        setShowReportForm(false); // Close the form after successful submission
        // Don't change tab, keep user on report tab to see their submitted report
      } else {
        showAlert('error', data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      showAlert('error', 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleReportFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (reportFiles.length + files.length > 5) {
      showAlert('warning', 'Maximum 5 files allowed for report evidence');
      return;
    }

    setReportFiles(prev => [...prev, ...files]);
  };

  const handleReportFileRemove = (index: number) => {
    setReportFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reviewRating <= 0) {
      showAlert('warning', 'Please provide a rating');
      return;
    }

    if (!reviewComment.trim()) {
      showAlert('warning', 'Please provide a comment');
      return;
    }

    if (!session || !currentUserId) {
      showAlert('error', 'Session or user information not available');
      return;
    }

    const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;

    setSubmittingReview(true);
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          reviewerId: currentUserId,
          revieweeId: otherUserId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        showAlert('success', 'Review submitted successfully!');
        setReviewRating(0);
        setReviewComment('');
        fetchReviews(); // Refresh reviews
        setShowReviewModal(false);
      } else {
        showAlert('error', data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showAlert('error', 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchReviews = async () => {
    if (!sessionId || !currentUserId) return;
    
    setLoadingReviews(true);
    try {
      const response = await fetch(`/api/reviews?sessionId=${sessionId}&userId=${currentUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews);
        setUserReview(data.userReview);
        setReceivedReview(data.receivedReview);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Cancellation functions
  const fetchCancelRequest = async () => {
    if (!sessionId) return;
    
    setLoadingCancelRequest(true);
    try {
      const response = await fetch(`/api/session/${sessionId}/cancel`);
      
      if (!response.ok) {
        console.error('Fetch cancel request failed:', response.status, response.statusText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        const text = await response.text();
        console.error('Response body:', text);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCancelRequest(data.cancelRequest);
      }
    } catch (error) {
      console.error('Error fetching cancel request:', error);
    } finally {
      setLoadingCancelRequest(false);
    }
  };

  const handleCancelSession = async () => {
    if (!session || !currentUserId) {
      showAlert('error', 'Session or user information not available');
      return;
    }

    if (!cancelReason || !cancelDescription.trim()) {
      showAlert('warning', 'Please provide a reason and description for cancellation');
      return;
    }

    setSubmittingCancel(true);
    try {
      // Upload evidence files if any
      const evidenceFiles: string[] = [];
      for (const file of cancelFiles) {
        const fileUrl = await handleFileUpload(file);
        if (fileUrl) {
          evidenceFiles.push(fileUrl);
        }
      }

      const response = await fetch(`/api/session/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initiatorId: currentUserId,
          reason: cancelReason,
          description: cancelDescription,
          evidenceFiles,
        }),
      });

      if (!response.ok) {
        console.error('Cancel session request failed:', response.status, response.statusText);
        const text = await response.text();
        console.error('Response body:', text);
        showAlert('error', `Failed to submit cancellation request: ${response.status} ${response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        const text = await response.text();
        console.error('Response body:', text);
        showAlert('error', 'Server returned an invalid response');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        // Send notification to the other user
        if (session) {
          const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
          await sendNotification(
            otherUserId,
            15, // SESSION_CANCEL_REQUESTED
            `${user?.firstName || 'Someone'} has requested to cancel your session. Please review the request.`,
            `/session/${sessionId}`
          );
        }

        showAlert('success', 'Cancellation request submitted successfully. The other user will be notified to review your request.');
        setCancelRequest(data.cancelRequest);
        setShowCancelModal(false);
        setCancelReason('');
        setCancelDescription('');
        setCancelFiles([]);
        
        // Refresh session data to update the UI status
        await fetchSessionData();
      } else {
        showAlert('error', data.message || 'Failed to submit cancellation request');
      }
    } catch (error) {
      console.error('Error submitting cancellation request:', error);
      showAlert('error', 'Failed to submit cancellation request');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleCancelResponse = async () => {
    if (!cancelRequest || !currentUserId) {
      showAlert('error', 'Cancellation request or user information not available');
      return;
    }

    if (cancelResponse === 'dispute' && !cancelResponseDescription.trim()) {
      showAlert('warning', 'Please provide a description when disputing the cancellation');
      return;
    }

    setSubmittingCancelResponse(true);
    try {
      // Upload response evidence files if any
      const responseEvidenceFiles: string[] = [];
      for (const file of cancelResponseFiles) {
        const fileUrl = await handleFileUpload(file);
        if (fileUrl) {
          responseEvidenceFiles.push(fileUrl);
        }
      }

      const response = await fetch(`/api/session/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responderId: currentUserId,
          action: cancelResponse,
          responseDescription: cancelResponseDescription,
          responseEvidenceFiles,
          workCompletionPercentage,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Send notification to the initiator
        const initiatorId = cancelRequest.initiatorId._id || cancelRequest.initiatorId;
        if (cancelResponse === 'agree') {
          await sendNotification(
            initiatorId,
            16, // SESSION_CANCEL_AGREED
            `${user?.firstName || 'Someone'} has agreed to your session cancellation request. The session has been cancelled.`,
            `/session/${sessionId}`
          );
          showAlert('success', 'You have agreed to the cancellation. The session has been cancelled.');
        } else {
          await sendNotification(
            initiatorId,
            17, // SESSION_CANCEL_DISPUTED
            `${user?.firstName || 'Someone'} has disputed your session cancellation request. Please review their response.`,
            `/session/${sessionId}`
          );
          showAlert('info', 'You have disputed the cancellation request. The initiator will review your response.');
        }

        setCancelRequest(data.cancelRequest);
        setShowCancelResponseModal(false);
        setCancelResponse('agree');
        setCancelResponseDescription('');
        setCancelResponseFiles([]);
        setWorkCompletionPercentage(50);

        // Refresh session if cancelled
        if (data.sessionUpdated) {
          await fetchSessionData();
        }
      } else {
        showAlert('error', data.message || 'Failed to respond to cancellation request');
      }
    } catch (error) {
      console.error('Error responding to cancellation request:', error);
      showAlert('error', 'Failed to respond to cancellation request');
    } finally {
      setSubmittingCancelResponse(false);
    }
  };

  const handleCancelFinalize = async () => {
    if (!cancelRequest || !currentUserId) {
      showAlert('error', 'Cancellation request or user information not available');
      return;
    }

    if (!cancelFinalNote.trim()) {
      showAlert('warning', 'Please provide a final note for the cancellation');
      return;
    }

    setSubmittingCancelFinalize(true);
    try {
      const response = await fetch(`/api/session/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responderId: currentUserId,
          action: 'finalize',
          finalNote: cancelFinalNote,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Send notification to the other user
        if (session) {
          const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
          await sendNotification(
            otherUserId,
            16, // SESSION_CANCEL_AGREED
            `${user?.firstName || 'Someone'} has finalized the session cancellation. The session has been cancelled.`,
            `/session/${sessionId}`
          );
        }

        showAlert('success', 'Session cancellation has been finalized. The session has been cancelled.');
        setCancelRequest(data.cancelRequest);
        setShowCancelFinalizeModal(false);
        setCancelFinalNote('');

        // Refresh session data
        await fetchSessionData();
      } else {
        showAlert('error', data.message || 'Failed to finalize cancellation');
      }
    } catch (error) {
      console.error('Error finalizing cancellation:', error);
      showAlert('error', 'Failed to finalize cancellation');
    } finally {
      setSubmittingCancelFinalize(false);
    }
  };

  const handleCancelFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setCancelFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleCancelResponseFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setCancelResponseFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeCancelFile = (index: number) => {
    setCancelFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeCancelResponseFile = (index: number) => {
    setCancelResponseFiles(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (sessionId) {
      fetchReviews();
      fetchCancelRequest();
    }
  }, [sessionId]);

  // Redirect to overview tab if user is on disabled tab when session is cancelled/completed
  useEffect(() => {
    if ((session?.status === 'canceled' || session?.status === 'completed') && 
        (activeTab === 'submit-work' || activeTab === 'report')) {
      setActiveTab('overview');
    }
  }, [session?.status, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access this session.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const otherUser = session.user1Id._id === currentUserId ? session.user2Id : session.user1Id;
  const mySkill = session.user1Id._id === currentUserId ? session.skill1Id : session.skill2Id;
  const otherSkill = session.user1Id._id === currentUserId ? session.skill2Id : session.skill1Id;
  const myDescription = session.user1Id._id === currentUserId ? session.descriptionOfService1 : session.descriptionOfService2;
  const otherDescription = session.user1Id._id === currentUserId ? session.descriptionOfService2 : session.descriptionOfService1;

  // Get proper display name for other user
  const getOtherUserName = () => {
    if (otherUserDetails) {
      const fullName = `${otherUserDetails.firstName || ''} ${otherUserDetails.lastName || ''}`.trim();
      return fullName || otherUserDetails.name || 'Other User';
    }
    return otherUser?.name || `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'Other User';
  };

  // Get proper display name for any user
  const getUserName = (user: any) => {
    if (user._id === currentUserId) {
      return 'You';
    }
    if (otherUserDetails && user._id === otherUserDetails._id) {
      const fullName = `${otherUserDetails.firstName || ''} ${otherUserDetails.lastName || ''}`.trim();
      return fullName || otherUserDetails.name || 'Unknown User';
    }
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.name || 'Unknown User';
  };

  // Clean up skill descriptions to handle malformed data
  const cleanDescription = (description: string) => {
    if (!description) return 'No description provided';
    
    // Remove common prefixes that might be accidentally included
    const cleanedDesc = description
      .replace(/^(For the job description|Job description|Description):?\s*/i, '')
      .replace(/^(Service description|About|Details):?\s*/i, '')
      .trim();
    
    // If after cleaning it's empty or too short, return a fallback
    if (!cleanedDesc || cleanedDesc.length < 10) {
      return 'No detailed description provided';
    }
    
    // Truncate if too long for display
    if (cleanedDesc.length > 200) {
      return cleanedDesc.substring(0, 197) + '...';
    }
    
    return cleanedDesc;
  };

  // Get expected end date from session progress
  const getExpectedEndDate = () => {
    // First, check if the session has an expected end date set during creation
    if (session?.expectedEndDate) {
      const expectedDate = new Date(session.expectedEndDate);
      const today = new Date();
      const isOverdue = today > expectedDate;
      
      if (isOverdue) {
        const daysOverdue = Math.ceil((today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
        return `${formatDate(session.expectedEndDate)} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue)`;
      } else {
        const daysRemaining = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining === 0) {
          return `${formatDate(session.expectedEndDate)} (Due today)`;
        } else {
          return `${formatDate(session.expectedEndDate)} (${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining)`;
        }
      }
    }
    
    // Fallback: Try to get the earliest due date from both users' progress
    const dueDates = [];
    
    if (myProgress?.dueDate) {
      dueDates.push(new Date(myProgress.dueDate));
    }
    
    if (otherProgress?.dueDate) {
      dueDates.push(new Date(otherProgress.dueDate));
    }
    
    if (dueDates.length === 0) {
      return 'Not set yet';
    }
    
    // Use the earliest due date as the expected session end
    const earliestDueDate = new Date(Math.min(...dueDates.map(d => d.getTime())));
    
    // Check if it's overdue
    const today = new Date();
    const isOverdue = today > earliestDueDate;
    
    if (isOverdue) {
      const daysOverdue = Math.ceil((today.getTime() - earliestDueDate.getTime()) / (1000 * 60 * 60 * 24));
      return `${formatDate(earliestDueDate.toISOString())} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue)`;
    } else {
      const daysRemaining = Math.ceil((earliestDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysRemaining === 0) {
        return `${formatDate(earliestDueDate.toISOString())} (Due today)`;
      } else {
        return `${formatDate(earliestDueDate.toISOString())} (${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining)`;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  Session with {getOtherUserName()}
                </h1>
                {session?.status === 'completed' && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✓ Completed
                  </span>
                )}
                {session?.status === 'active' && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    ● Active
                  </span>
                )}
                {session?.status === 'canceled' && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✕ Cancelled
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Started:</span>
              <span className="text-sm font-medium">{formatDate(session.startDate)}</span>
              {session?.status === 'completed' && (
                <>
                  <span className="text-sm text-gray-400 mx-2">•</span>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className="text-sm font-medium text-green-600">Completed</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'submit-work', label: 'Submit Work', icon: Upload },
              { id: 'view-works', label: 'View Works', icon: CheckCircle },
              { id: 'progress', label: 'Progress', icon: Clock },
              { id: 'report', label: 'Report Issue', icon: Flag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isDisabled = (session?.status === 'canceled' || session?.status === 'completed') && 
                                (tab.id === 'submit-work' || tab.id === 'report');
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id as any)}
                  disabled={isDisabled}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isDisabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed opacity-60'
                      : activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  title={isDisabled ? 
                    `Cannot ${tab.label.toLowerCase()} - session is ${session?.status}` : 
                    undefined
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {isDisabled && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({session?.status === 'completed' ? 'Completed' : 'Cancelled'})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            session={session}
            works={works}
            myProgress={myProgress}
            otherProgress={otherProgress}
            completionStatus={completionStatus}
            currentUserId={currentUserId}
            user={user}
            otherUserDetails={otherUserDetails}
            reviews={reviews}
            userReview={userReview}
            receivedReview={receivedReview}
            loadingReviews={loadingReviews}
            formatDate={formatDate}
            getOtherUserName={getOtherUserName}
            getUserName={getUserName}
            cleanDescription={cleanDescription}
            getExpectedEndDate={getExpectedEndDate}
            showAlert={(type: string, message: string, title?: string) => showAlert(type as 'success' | 'error' | 'warning' | 'info', message, title)}
            setActiveTab={(tab: string) => setActiveTab(tab as 'overview' | 'submit-work' | 'view-works' | 'progress' | 'report')}
            setShowReviewModal={setShowReviewModal}
            handleRequestCompletion={handleRequestCompletion}
            handleCompletionResponse={handleCompletionResponse}
            requestingCompletion={requestingCompletion}
            respondingToCompletion={respondingToCompletion}
            cancelRequest={cancelRequest}
            loadingCancelRequest={loadingCancelRequest}
            setShowCancelModal={setShowCancelModal}
            setShowCancelResponseModal={setShowCancelResponseModal}
            setShowCancelFinalizeModal={setShowCancelFinalizeModal}
            handleDownloadFile={handleDownloadFile}
          />
        )}

        {activeTab === 'submit-work' && (
          <SubmitWorkTab
            session={session}
            works={works}
            currentUserId={currentUserId}
            workDescription={workDescription}
            setWorkDescription={setWorkDescription}
            workFiles={workFiles}
            setWorkFiles={setWorkFiles}
            uploading={uploading}
            handleSubmitWork={handleSubmitWork}
            handleDownloadFile={handleDownloadFile}
            formatDate={formatDate}
            showAlert={(type: string, message: string) => showAlert(type as 'success' | 'error' | 'warning' | 'info', message)}
          />
        )}

        {activeTab === 'view-works' && (
          <ViewWorksTab
            works={works}
            currentUserId={currentUserId}
            formatDate={formatDate}
            getUserName={getUserName}
            handleDownloadFile={handleDownloadFile}
            setReviewingWork={setReviewingWork}
            setReviewAction={setReviewAction}
            setReviewMessage={setReviewMessage}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressTab
            myProgress={myProgress}
            otherProgress={otherProgress}
            formatDate={formatDate}
            getOtherUserName={getOtherUserName}
            openProgressEditor={openProgressEditor}
          />
        )}

        {activeTab === 'report' && (
          <ReportTab
            session={session}
            existingReports={existingReports}
            loadingReports={loadingReports}
            showReportForm={showReportForm}
            setShowReportForm={setShowReportForm}
            reportReason={reportReason}
            setReportReason={setReportReason}
            reportDescription={reportDescription}
            setReportDescription={setReportDescription}
            reportFiles={reportFiles}
            setReportFiles={setReportFiles}
            submittingReport={submittingReport}
            handleReportSubmit={handleReportSubmit}
            handleReportFileAdd={handleReportFileAdd}
            handleReportFileRemove={handleReportFileRemove}
            fetchReports={fetchReports}
            formatDate={formatDate}
            showAlert={(type: string, message: string) => showAlert(type as 'success' | 'error' | 'warning' | 'info', message)}
          />
        )}
      </div>

      {/* Work Review Modal */}
      {reviewingWork && reviewAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {reviewAction === 'accept' ? 'Accept Work' : 'Request Improvement'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reviewAction === 'accept' ? 'Acceptance Message (Optional)' : 'Improvement Request *'}
                </label>
                <textarea
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  placeholder={
                    reviewAction === 'accept' 
                      ? 'Add a message to thank or acknowledge the work...' 
                      : 'Please specify what improvements are needed...'
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required={reviewAction === 'reject'}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setReviewingWork(null);
                    setReviewAction(null);
                    setReviewMessage('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (reviewAction === 'reject' && !reviewMessage.trim()) {
                      showAlert('warning', 'Please provide improvement request details');
                      return;
                    }
                    handleWorkReview(reviewingWork, reviewAction, reviewMessage);
                  }}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    reviewAction === 'accept' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewAction === 'accept' ? 'Accept Work' : 'Send Improvement Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {editingProgress && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Your Progress</h3>
              
              {/* Progress Percentage */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Percentage *
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setNewProgress(value);
                      updateStatusBasedOnProgress(value);
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-16">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newProgress}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        setNewProgress(value);
                        updateStatusBasedOnProgress(value);
                      }}
                      className="w-full p-2 border border-gray-300 rounded text-center"
                    />
                  </div>
                  <span className="text-sm text-gray-500">%</span>
                </div>
                {/* Progress Bar Preview */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${newProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={progressStatus}
                  onChange={(e) => setProgressStatus(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Notes (Optional)
                </label>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="Share what you've accomplished, challenges faced, or next steps..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingProgress(false);
                    setProgressNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProgressUpdate}
                  disabled={updatingProgress}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingProgress ? 'Updating...' : 'Update Progress'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  onClick={() => setShowRejectionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectionSubmit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Submit Rejection Reason
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {userReview ? 'Edit Your Review' : 'Submit Your Review'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition-all hover:scale-110 ${
                        reviewRating >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {reviewRating > 0 ? `${reviewRating}/5` : 'Click to rate'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment *
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your feedback about the session..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewRating(0);
                    setReviewComment('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={submittingReview || reviewRating === 0 || !reviewComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Session Cancellation</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="scheduling_conflict">Scheduling Conflict</option>
                  <option value="changed_requirements">Changed Requirements</option>
                  <option value="technical_issues">Technical Issues</option>
                  <option value="personal_reasons">Personal Reasons</option>
                  <option value="quality_concerns">Quality Concerns</option>
                  <option value="communication_issues">Communication Issues</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  value={cancelDescription}
                  onChange={(e) => setCancelDescription(e.target.value)}
                  placeholder="Please provide a detailed explanation for the cancellation request..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence Files (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleCancelFileAdd}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  accept="image/*,.pdf,.doc,.docx"
                />
                {cancelFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {cancelFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeCancelFile(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setCancelDescription('');
                    setCancelFiles([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelSession}
                  disabled={submittingCancel || !cancelReason || !cancelDescription.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingCancel ? 'Submitting...' : 'Submit Cancellation Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Response Modal */}
      {showCancelResponseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Respond to Cancellation Request</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                                                                             <input
                      type="radio"
                      value="agree"
                      checked={cancelResponse === 'agree'}
                      onChange={(e) => setCancelResponse(e.target.value as 'agree' | 'dispute')}
                      className="mr-2"
                    />
                    <span className="text-green-700">Agree to cancel the session</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="dispute"
                      checked={cancelResponse === 'dispute'}
                      onChange={(e) => setCancelResponse(e.target.value as 'agree' | 'dispute')}
                      className="mr-2"
                    />
                    <span className="text-red-700">Dispute the cancellation</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Completion Percentage
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={workCompletionPercentage}
                    onChange={(e) => setWorkCompletionPercentage(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={workCompletionPercentage}
                      onChange={(e) => setWorkCompletionPercentage(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                      className="w-full p-2 border border-gray-300 rounded text-center"
                    />
                  </div>
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${workCompletionPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {cancelResponse === 'agree' ? 'Additional Comments (Optional)' : 'Explanation for Dispute *'}
                </label>
                <textarea
                  value={cancelResponseDescription}
                  onChange={(e) => setCancelResponseDescription(e.target.value)}
                  placeholder={
                    cancelResponse === 'agree' 
                      ? 'Any additional comments about the cancellation...'
                      : 'Please explain why you disagree with the cancellation request...'
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required={cancelResponse === 'dispute'}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence Files (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleCancelResponseFileAdd}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  accept="image/*,.pdf,.doc,.docx"
                />
                {cancelResponseFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {cancelResponseFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeCancelResponseFile(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCancelResponseModal(false);
                    setCancelResponse('agree');
                    setCancelResponseDescription('');
                    setCancelResponseFiles([]);
                    setWorkCompletionPercentage(50);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelResponse}
                  disabled={submittingCancelResponse || (cancelResponse === 'dispute' && !cancelResponseDescription.trim())}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    cancelResponse === 'agree' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submittingCancelResponse ? 'Submitting...' : 
                   cancelResponse === 'agree' ? 'Agree to Cancel' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Finalize Modal */}
      {showCancelFinalizeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Finalize Session Cancellation</h3>
              
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  The other user has disputed your cancellation request. You can now provide a final decision and reason to proceed with the cancellation.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Decision and Reason *
                </label>
                <textarea
                  value={cancelFinalNote}
                  onChange={(e) => setCancelFinalNote(e.target.value)}
                  placeholder="Please provide your final reason for proceeding with the cancellation despite the dispute..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCancelFinalizeModal(false);
                    setCancelFinalNote('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelFinalize}
                  disabled={submittingCancelFinalize || !cancelFinalNote.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingCancelFinalize ? 'Finalizing...' : 'Finalize Cancellation'}
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
        showCloseButton={true}
        autoClose={false}
      />

      {/* Confirmation Dialog Component */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        type={confirmation.type}
        loading={confirmation.loading}
      />
    </div>
  );
}
