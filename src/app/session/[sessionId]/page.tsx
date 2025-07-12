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
  const currentUserId = user?._id;
  
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
        await fetchReports(); // Refresh reports list
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
      showAlert('warning', 'Maximum 5 files allowed');
      return;
    }
    setReportFiles([...reportFiles, ...files]);
  };

  const handleReportFileRemove = (index: number) => {
    setReportFiles(reportFiles.filter((_, i) => i !== index));
  };

  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      showAlert('warning', 'Please provide a reason for declining the completion request');
      return;
    }
    handleCompletionResponse('reject', rejectionReason.trim());
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

  useEffect(() => {
    if (sessionId) {
      fetchReviews();
    }
  }, [sessionId]);

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
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
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

              {/* Expected End Date Alert (for active sessions) */}
              {session?.status === 'active' && (session?.expectedEndDate || myProgress?.dueDate || otherProgress?.dueDate) && (
                <div className="mb-4">
                  {(() => {
                    let targetDate;
                    
                    // Prioritize session expected end date
                    if (session?.expectedEndDate) {
                      targetDate = new Date(session.expectedEndDate);
                    } else {
                      // Fallback to earliest progress due date
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
                  {/* Start Date */}
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Started</div>
                      <div className="text-sm text-gray-600">{formatDate(session.startDate)}</div>
                    </div>
                  </div>
                  
                  {/* End Date - Completed or Expected */}
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
                  
                  {/* Duration */}
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
                      /* User requested completion - waiting for approval */
                      <span className="text-sm text-yellow-600 font-medium bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                        Completion Requested - Waiting for Approval
                      </span>
                    ) : completionStatus.needsToApprove ? (
                      /* Other user requested completion - needs approval */
                      <>
                        <button
                          onClick={() => handleCompletionResponse('approve')}
                          disabled={respondingToCompletion}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve Completion</span>
                        </button>
                        <button
                          onClick={() => handleCompletionResponse('reject')}
                          disabled={respondingToCompletion}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : completionStatus.wasRejected ? (
                      /* Completion was rejected - can request again */
                      <button
                        onClick={handleRequestCompletion}
                        disabled={requestingCompletion}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Request Completion Again</span>
                      </button>
                    ) : completionStatus.canRequestCompletion ? (
                      /* No completion request yet */
                      <button
                        onClick={handleRequestCompletion}
                        disabled={requestingCompletion}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>{requestingCompletion ? 'Requesting...' : 'Mark as Complete'}</span>
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

            {/* Progress Summary */}
            {(myProgress || otherProgress) && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Progress Summary</h2>
                  <button
                    onClick={() => setActiveTab('progress')}
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

            {/* Session Completion Section */}
            {session?.status === 'active' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Completion</h2>
                
                {/* Completion Request Status */}
                {completionStatus.hasRequestedCompletion ? (
                  /* User requested completion - waiting for approval */
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-900">Completion Request Sent</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          You've requested to complete this session. 
                          Waiting for {getOtherUserName()} to approve.
                        </p>
                        {completionStatus.pendingRequests.length > 0 && (
                          <p className="text-xs text-yellow-600 mt-2">
                            Request sent: {formatDate(completionStatus.pendingRequests[0].requestedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : completionStatus.needsToApprove ? (
                  /* Other user requested completion - needs approval */
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-blue-900">Completion Request Received</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          {completionStatus.requesterName || getOtherUserName()} has requested to complete this session. 
                          Please review and decide whether to approve.
                        </p>
                        {completionStatus.pendingRequests.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            Request received: {formatDate(completionStatus.pendingRequests[0].requestedAt)}
                          </p>
                        )}
                        <div className="mt-3 flex items-center space-x-3">
                          <button
                            onClick={() => handleCompletionResponse('approve')}
                            disabled={respondingToCompletion}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>{respondingToCompletion ? 'Processing...' : 'Approve Completion'}</span>
                          </button>
                          <button
                            onClick={() => handleCompletionResponse('reject')}
                            disabled={respondingToCompletion}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Decline with Reason</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : completionStatus.wasRejected ? (
                  /* Completion was rejected - show rejection message */
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-900">Completion Request Declined</h3>
                        <p className="text-sm text-red-700 mt-1">
                          Your recent completion request was declined. You can submit a new request when ready.
                        </p>
                        <p className="text-xs text-red-600 mt-2">
                          You can continue working on the session or submit a new completion request when ready.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : completionStatus.canRequestCompletion ? (
                  /* No completion request yet */
                  <div className="space-y-4">
                    {/* Completion readiness check */}
                    {myProgress && otherProgress && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Completion Readiness</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Your progress</span>
                            <span className={`text-sm font-medium ${myProgress.completionPercentage >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {myProgress.completionPercentage}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{getOtherUserName()}'s progress</span>
                            <span className={`text-sm font-medium ${otherProgress.completionPercentage >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {otherProgress.completionPercentage}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Accepted work submissions</span>
                            <span className="text-sm font-medium text-gray-900">
                              {works.filter(w => w.acceptanceStatus === 'accepted').length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Request completion button */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleRequestCompletion}
                        disabled={requestingCompletion}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>{requestingCompletion ? 'Requesting...' : 'Request Session Completion'}</span>
                      </button>
                      <div className="text-sm text-gray-500">
                        <p>Ready to complete? Click to request approval from {getOtherUserName()}.</p>
                        <p className="text-xs mt-1">Both participants must agree to mark the session as completed.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Default case - no specific completion status */
                  <div className="text-sm text-gray-600">
                    <p>Loading completion status...</p>
                  </div>
                )}
              </div>
            )}

            {/* Completed Session Status */}
            {session?.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Session Completed! 🎉</h3>
                    <p className="text-sm text-green-700 mt-1">
                      This skill exchange session has been successfully completed. Both participants have agreed to mark it as finished.
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      You can still view submitted work and session details, or provide ratings for your exchange partner.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Review Section - Only show for completed sessions */}
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
                              onClick={() => setShowReviewModal(true)}
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
          </div>
        )}

        {activeTab === 'submit-work' && (
          <div className="space-y-6">
            {/* Session Completed Message or Submit Form */}
            {session?.status === 'completed' ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Completed</h2>
                  <p className="text-gray-600 mb-4">
                    This session has been completed. You can no longer submit new work.
                  </p>
                  <p className="text-sm text-gray-500">
                    You can still view previously submitted work below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Work</h2>
                
                <form onSubmit={handleSubmitWork} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Description *
                    </label>
                    <textarea
                      value={workDescription}
                      onChange={(e) => setWorkDescription(e.target.value)}
                      placeholder="Describe the work you've completed, what you've learned, or what you've taught..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach Files (Optional - Max 5 files, 100MB each)
                    </label>
                    
                    {/* File Upload Input */}
                    <input
                      type="file"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (workFiles.length + files.length > 5) {
                          showAlert('warning', 'Maximum 5 files allowed');
                          return;
                        }
                        
                        const newFiles = files.map(file => ({
                          file,
                          title: file.name.split('.').slice(0, -1).join('.') || 'Uploaded File'
                        }));
                        
                        setWorkFiles([...workFiles, ...newFiles]);
                        // Clear the input
                        e.target.value = '';
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.mp4,.mov,.avi,.mkv"
                      multiple
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, MP4, MOV, AVI, MKV
                    </p>
                    
                    {/* Selected Files List */}
                    {workFiles.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium text-gray-700">Selected Files ({workFiles.length}/5):</p>
                        {workFiles.map((workFileItem, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 truncate">{workFileItem.file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(workFileItem.file.size / (1024 * 1024)).toFixed(1)} MB)
                                  </span>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Title for this file:
                                  </label>
                                  <input
                                    type="text"
                                    value={workFileItem.title}
                                    onChange={(e) => {
                                      const updatedFiles = [...workFiles];
                                      updatedFiles[index].title = e.target.value;
                                      setWorkFiles(updatedFiles);
                                    }}
                                    placeholder="Enter a descriptive title..."
                                    className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setWorkFiles(workFiles.filter((_, i) => i !== index));
                                }}
                                className="ml-3 text-red-600 hover:text-red-700 flex-shrink-0"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setWorkDescription('');
                        setWorkFiles([]);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading ? 'Submitting...' : 'Submit Work'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Previously Submitted Works */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {session?.status === 'completed' ? 'Previously Submitted Works' : 'Your Submitted Works'} ({works.filter(w => w.provideUser._id === currentUserId).length})
              </h2>
              
              {works.filter(w => w.provideUser._id === currentUserId).length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Submitted</h3>
                  <p className="text-gray-600">
                    {session?.status === 'completed' 
                      ? 'You did not submit any work during this session.' 
                      : 'You haven\'t submitted any work yet.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {works.filter(w => w.provideUser._id === currentUserId).map((work) => (
                    <div key={work._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium text-gray-900">Your Work</div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            work.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                            work.acceptanceStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {work.acceptanceStatus}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{work.workDescription}</p>
                      
                      {/* Display multiple files if available */}
                      {work.workFiles && work.workFiles.length > 0 ? (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Attachments ({work.workFiles.length}):
                          </div>
                          <div className="space-y-2">
                            {work.workFiles.map((file: any, index: number) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {file.fileTitle}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {file.fileName}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownloadFile(file.fileURL, file.fileName)}
                                  className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                                >
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : work.workURL && work.workURL !== 'text-only' ? (
                        <div className="mb-3">
                          <button
                            onClick={() => handleDownloadFile(work.workURL)}
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Download Attachment</span>
                          </button>
                        </div>
                      ) : null}
                      
                      {work.remark && work.acceptanceStatus === 'accepted' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                          <div className="text-sm font-medium text-green-800 mb-1">Acceptance Message:</div>
                          <div className="text-sm text-green-700">{work.remark}</div>
                        </div>
                      )}
                      
                      {work.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</div>
                          <div className="text-sm text-red-700">{work.rejectionReason}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'view-works' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Submitted Works ({works.length})
              </h2>
              
              {works.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Works Yet</h3>
                  <p className="text-gray-600">No work has been submitted for this session yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {works.map((work) => (
                    <div key={work._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium text-gray-900">
                            {getUserName(work.provideUser)}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            work.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                            work.acceptanceStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {work.acceptanceStatus}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{work.workDescription}</p>
                      
                      {/* Display multiple files if available */}
                      {work.workFiles && work.workFiles.length > 0 ? (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Attachments ({work.workFiles.length}):
                          </div>
                          <div className="space-y-2">
                            {work.workFiles.map((file: any, index: number) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {file.fileTitle}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {file.fileName}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDownloadFile(file.fileURL, file.fileName)}
                                  className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                                >
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : work.workURL && work.workURL !== 'text-only' ? (
                        <div className="mb-3">
                          <button
                            onClick={() => handleDownloadFile(work.workURL)}
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Download Attachment</span>
                          </button>
                        </div>
                      ) : null}
                      
                      {/* Action buttons for receiving user */}
                      {work.receiveUser._id === currentUserId && work.acceptanceStatus === 'pending' && (
                        <div className="mt-3 flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setReviewingWork(work._id);
                              setReviewAction('accept');
                              setReviewMessage('');
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setReviewingWork(work._id);
                              setReviewAction('reject');
                              setReviewMessage('');
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Request Improvement
                          </button>
                        </div>
                      )}
                      
                      {work.remark && work.acceptanceStatus === 'accepted' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                          <div className="text-sm font-medium text-green-800 mb-1">Acceptance Message:</div>
                          <div className="text-sm text-green-700">{work.remark}</div>
                        </div>
                      )}
                      
                      {work.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</div>
                          <div className="text-sm text-red-700">{work.rejectionReason}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Current Progress Display */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Progress Tracking</h2>
                <button
                  onClick={openProgressEditor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update My Progress
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* My Progress */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Your Progress</h3>
                  {myProgress ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-900">Completion</span>
                        <span className="text-lg font-bold text-blue-900">{myProgress.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${myProgress.completionPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          myProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                          myProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          myProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {myProgress.status.replace('_', ' ')}
                        </span>
                      </div>
                      {myProgress.notes && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-blue-900">Notes:</span>
                          <p className="text-sm text-blue-700 mt-1">{myProgress.notes}</p>
                        </div>
                      )}
                      {myProgress.dueDate && (
                        <div className="mt-2">
                          <span className="text-sm text-blue-700">Due: {formatDate(myProgress.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-center">No progress data available</p>
                      <p className="text-sm text-gray-500 text-center mt-1">Click "Update My Progress" to get started</p>
                    </div>
                  )}
                </div>

                {/* Other User's Progress */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">{getOtherUserName()}'s Progress</h3>
                  {otherProgress ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-green-900">Completion</span>
                        <span className="text-lg font-bold text-green-900">{otherProgress.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-3 mb-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${otherProgress.completionPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          otherProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                          otherProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          otherProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {otherProgress.status.replace('_', ' ')}
                        </span>
                      </div>
                      {otherProgress.notes && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-green-900">Notes:</span>
                          <p className="text-sm text-green-700 mt-1">{otherProgress.notes}</p>
                        </div>
                      )}
                      {otherProgress.dueDate && (
                        <div className="mt-2">
                          <span className="text-sm text-green-700">Due: {formatDate(otherProgress.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-center">{getOtherUserName()} hasn't updated their progress yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            {/* Existing Reports Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {session?.status === 'completed' ? 'Session Reports' : 'Previous Reports'}
                </h2>
                <button
                  onClick={fetchReports}
                  disabled={loadingReports}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                >
                  {loadingReports ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loadingReports ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : existingReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Flag className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>
                    {session?.status === 'completed' 
                      ? 'No reports were submitted during this session' 
                      : 'No reports found for this session'
                    }
                  </p>
                  {session?.status !== 'completed' && (
                    <p className="text-sm">Submit your first report below if you're experiencing issues</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {existingReports.map((report) => {
                    // Only show reports made by current user, or reports against current user
                    const isMyReport = report.reportedBy._id === currentUserId;
                    const wasReported = report.reportedUser._id === currentUserId;
                    
                    if (!isMyReport && !wasReported) {
                      return null;
                    }

                    return (
                      <div key={report._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm">
                              {isMyReport ? (
                                <>
                                  <span className="font-medium">You reported</span>
                                  <span className="text-gray-600 ml-1">{getOtherUserName()}</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium text-red-600">You were reported</span>
                                  <span className="text-gray-600 ml-1">by {getOtherUserName()}</span>
                                </>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              report.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                              report.status === 'dismissed' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(report.createdAt)}
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            Reason: {report.reason.replace('_', ' ')}
                          </div>
                          {isMyReport ? (
                            <p className="text-sm text-gray-700">{report.description}</p>
                          ) : (
                            <p className="text-sm text-gray-600 italic">Report details are not shown for privacy</p>
                          )}
                        </div>

                        {/* For reports against current user without admin response, show a notice */}
                        {wasReported && !isMyReport && !report.adminResponse && (
                          <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded p-3">
                            <div className="text-sm text-yellow-800">
                              <div className="font-medium mb-1">Report Under Review</div>
                              <p>A report has been submitted regarding your participation in this session. Our admin team is currently reviewing the matter and will respond accordingly.</p>
                            </div>
                          </div>
                        )}

                        {/* Only show evidence files for reports made by current user */}
                        {isMyReport && report.evidenceFiles && report.evidenceFiles.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-900 mb-2">Evidence Files:</div>
                            <div className="space-y-1">
                              {report.evidenceFiles.map((fileUrl: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => handleDownloadFile(fileUrl, `evidence-${index + 1}`)}
                                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Evidence File {index + 1}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Case summary - only show for own reports */}
                        {isMyReport && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <div className="font-medium text-gray-900 mb-2">Case Summary:</div>
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">Reported User Works:</span> {report.reportedUserWorksCount}
                              </div>
                              <div>
                                <span className="font-medium">Your Works:</span> {report.reportingUserWorksCount}
                              </div>
                              <div>
                                <span className="font-medium">Their Last Active:</span> 
                                {report.reportedUserLastActive 
                                  ? formatDate(report.reportedUserLastActive)
                                  : 'Unknown'
                                }
                              </div>
                              <div>
                                <span className="font-medium">Report Date:</span> {formatDate(report.createdAt)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Admin Response - show for all reports with responses */}
                        {report.adminResponse && (
                          <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                            <div className="text-sm font-medium text-blue-900 mb-1">
                              Admin Response:
                              {report.adminId && (
                                <span className="text-blue-700 ml-1">
                                  by {report.adminId.firstName} {report.adminId.lastName}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-blue-800">{report.adminResponse}</p>
                            {report.resolvedAt && (
                              <div className="text-xs text-blue-600 mt-1">
                                Resolved on {formatDate(report.resolvedAt)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit New Report Section */}
            {session?.status === 'completed' ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                  <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Completed</h2>
                  <p className="text-gray-600 mb-4">
                    This session has been completed. You can no longer submit new reports.
                  </p>
                  <p className="text-sm text-gray-500">
                    If you have concerns about behavior during this session, please contact support directly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                {/* Collapsible Report Header */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowReportForm(!showReportForm)}
                    className="flex items-center justify-between w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Report an Issue</h2>
                      <p className="text-sm text-gray-600">
                        {showReportForm 
                          ? 'Click to hide the report form' 
                          : 'Click to report issues with this session'
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Flag className="h-5 w-5 text-gray-400" />
                      {showReportForm ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Collapsible Report Form */}
                {showReportForm && (
                  <div className="border-t border-gray-200 pt-6">
                    {/* Report Context Warning */}
                    <div className="mb-6 space-y-4">
                      {/* Session Activity Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-3">Session Activity Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">Your Contributions</h4>
                            <div className="text-sm text-blue-700 mt-1">
                              <div>Work submitted: {works.filter(w => w.provideUser._id === currentUserId).length}</div>
                              <div>Progress: {myProgress?.completionPercentage || 0}%</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">{getOtherUserName()}'s Contributions</h4>
                            <div className="text-sm text-blue-700 mt-1">
                              <div>Work submitted: {works.filter(w => w.provideUser._id !== currentUserId).length}</div>
                              <div>Progress: {otherProgress?.completionPercentage || 0}%</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Comparison Warning */}
                      {otherProgress && myProgress && otherProgress.completionPercentage > myProgress.completionPercentage && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.334 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                              <h3 className="font-medium text-yellow-900">Progress Consideration</h3>
                              <p className="text-sm text-yellow-700 mt-1">
                                {getOtherUserName()} has higher progress ({otherProgress.completionPercentage}%) than you ({myProgress.completionPercentage}%). 
                                Please consider your own contribution level before reporting. Ensure your concerns are valid and not related to your own progress.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Work Submission Warning */}
                      {works.filter(w => w.provideUser._id !== currentUserId).length > works.filter(w => w.provideUser._id === currentUserId).length && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <svg className="h-5 w-5 text-orange-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.334 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                              <h3 className="font-medium text-orange-900">Work Submission Notice</h3>
                              <p className="text-sm text-orange-700 mt-1">
                                {getOtherUserName()} has submitted more work ({works.filter(w => w.provideUser._id !== currentUserId).length}) than you ({works.filter(w => w.provideUser._id === currentUserId).length}). 
                                Please ensure your report is about legitimate issues and not about work quality expectations.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Previous Report Warning */}
                      {existingReports.length > 0 && session?.status !== 'completed' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.334 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                              <h3 className="font-medium text-red-900">Previous Reports Submitted</h3>
                              <p className="text-sm text-red-700 mt-1">
                                {existingReports.length} report{existingReports.length > 1 ? 's have' : ' has'} already been submitted for this session.
                                Consider resolving issues directly with {getOtherUserName()} first before submitting additional reports.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        If you're experiencing issues with {getOtherUserName()} in this session, please report it here. 
                        Our team will review the situation and take appropriate action. Please address the context shown above in your description.
                      </p>
                    </div>

                    <form onSubmit={handleReportSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Report *
                        </label>
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select a reason...</option>
                          <option value="not_submitting_work">Not submitting work</option>
                          <option value="not_responsive">Not responsive to messages</option>
                          <option value="poor_quality_work">Poor quality work</option>
                          <option value="inappropriate_behavior">Inappropriate behavior</option>
                          <option value="not_following_session_terms">Not following session terms</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Detailed Description *
                        </label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          placeholder="Please provide a detailed description of the issue, including specific examples, dates, and any relevant context. Please address the session activity summary and any warnings shown above..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={6}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Evidence Files (Optional)
                        </label>
                        <div className="space-y-3">
                          <input
                            type="file"
                            onChange={handleReportFileAdd}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                            multiple
                          />
                          <p className="text-xs text-gray-500">
                            Upload screenshots, documents, or other evidence. Maximum 5 files.
                            Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP
                          </p>
                          
                          {reportFiles.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                              {reportFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleReportFileRemove(index)}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Important Notes:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>All reports are reviewed by our team</li>
                              <li>False reports may result in account restrictions</li>
                              <li>We will investigate both sides of the situation</li>
                              <li>You will be notified of the outcome</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setReportReason('');
                            setReportDescription('');
                            setReportFiles([]);
                          }}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReport}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingReport ? 'Submitting Report...' : 'Submit Report'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
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
