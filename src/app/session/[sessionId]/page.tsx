"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, BookOpen, FileText, Upload, CheckCircle, Clock, AlertCircle, Flag, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { createSystemApiHeaders } from '@/utils/systemApiAuth';

// Type imports
import type { 
  Session, 
  Work, 
  WorkFile, 
  SessionProgress, 
  Review, 
  CancelRequest, 
  AlertState, 
  ConfirmationState, 
  TabType, 
  ReviewAction, 
  CancelResponse, 
  FileWithTitle 
} from '@/types';

// Import tab components
import OverviewTab from '@/components/sessionTabs/OverviewTab';
import SubmitWorkTab from '@/components/sessionTabs/SubmitWorkTab';
import ViewWorksTab from '@/components/sessionTabs/ViewWorksTab';
import ProgressTab from '@/components/sessionTabs/ProgressTab';
import ReportTab from '@/components/sessionTabs/ReportTab';

export default function SessionWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth(); // Get JWT token for API calls
  const sessionId = params.sessionId as string;
  const currentUserId = user?._id
  
  const [session, setSession] = useState<Session | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [myProgress, setMyProgress] = useState<SessionProgress | null>(null);
  const [otherProgress, setOtherProgress] = useState<SessionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [otherUserDetails, setOtherUserDetails] = useState<any>(null);

  // Work review state - now handled in ViewWorksTab
  // Removed: reviewingWork, reviewAction, reviewMessage states

  // Progress update state - now handled by useProgress hook
  // Removed: editingProgress, newProgress, progressNotes, progressStatus, updatingProgress states

  // Report form state - now handled by useReport hook
  // Removed: reportReason, reportDescription, reportFiles, submittingReport, existingReports, loadingReports, showReportForm states

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

  // Helper function to send notifications
  const sendNotification = async (userId: string, typeno: number, description: string, targetDestination?: string) => {
    try {
      await fetch('/api/notification', {
        method: 'POST',
        headers: createSystemApiHeaders(),
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
    if (sessionId && token) {
      fetchSessionData();
    }
  }, [sessionId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentUserId && sessionId) {
      fetchWorks();
      fetchProgress();
      // fetchReports() now handled by useReport hook
    }
  }, [currentUserId, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session && currentUserId) {
      fetchOtherUserDetails();
    }
  }, [session, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!token) {
      console.error('No token available for session fetch');
      return;
    }

    try {
      const response = await fetch(`/api/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Session data loaded:', data.session);
        console.log('Skill 1:', data.session.skill1Id);
        console.log('Skill 2:', data.session.skill2Id);
        console.log('Description 1:', data.session.descriptionOfService1);
        console.log('Description 2:', data.session.descriptionOfService2);
        setSession(data.session);
        
        // If session status changed to cancelled or completed, also refresh other data
        if (data.session.status === 'canceled' || data.session.status === 'completed') {
          // Refresh works and progress to reflect the new status
          if (currentUserId) {
            fetchWorks();
            fetchProgress();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  // Comprehensive session data refresh
  const refreshSessionData = async () => {
    try {
      await fetchSessionData();
      if (currentUserId) {
        await Promise.all([
          fetchWorks(),
          fetchProgress()
          // fetchReports() now handled by useReport hook
        ]);
      }
    } catch (error) {
      console.error('Error refreshing session data:', error);
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
    // This function is now handled by the useReport hook
    // Keeping for backward compatibility but it's no longer used
    console.log('fetchReports function deprecated - now handled by useReport hook');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownloadFile = async (fileURL: string, fileName?: string) => {
    try {
      console.log('Downloading file:', fileURL, 'with filename:', fileName);
      const downloadUrl = `/api/file/retrieve?fileUrl=${encodeURIComponent(fileURL)}`;
      console.log('Download URL:', downloadUrl);
      
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
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
      
      console.log('Download filename:', downloadFileName);
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      showAlert('error', 'Failed to download file');
    }
  };

  // Work review is now handled in ViewWorksTab component

  // Progress update functions - now handled by useProgress hook
  // Removed: handleProgressUpdate, openProgressEditor, updateStatusBasedOnProgress

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

  // Report handling functions - now handled by useReport hook
  const handleReportSubmit = async () => {
    console.log('handleReportSubmit function deprecated - now handled by useReport hook');
    showAlert('info', 'Report functionality has been moved to the new service layer');
  };

  const handleReportFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleReportFileAdd function deprecated - now handled by useReport hook');
    showAlert('info', 'File upload functionality has been moved to the new service layer');
  };

  const handleReportFileRemove = (index: number) => {
    console.log('handleReportFileRemove function deprecated - now handled by useReport hook');
    showAlert('info', 'File removal functionality has been moved to the new service layer');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile responsive header */}
      <header className="bg-white shadow-sm border-b">
        <nav className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Mobile layout - stack vertically */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0 sm:h-16">
            {/* Top row on mobile - back button and title */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Session with {getOtherUserName()}
              </h1>
              {/* Status badges - hidden on mobile, shown on larger screens */}
              <div className="hidden sm:flex items-center space-x-2">
                {session?.status === 'completed' && (
                  <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                    ✓ Completed
                  </span>
                )}
                {session?.status === 'active' && (
                  <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                    ● Active
                  </span>
                )}
                {session?.status === 'canceled' && (
                  <span className="bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                    ✕ Cancelled
                  </span>
                )}
              </div>
            </div>
            
            {/* Bottom row on mobile - session info and status */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 sm:mt-0">
              {/* Date info */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500">Started:</span>
                <span className="text-xs sm:text-sm font-medium">{formatDate(session.startDate)}</span>
              </div>
              
              {/* Status badges - visible on mobile */}
              <div className="flex items-center space-x-2 sm:hidden">
                {session?.status === 'completed' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Completed
                  </span>
                )}
                {session?.status === 'active' && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    ● Active
                  </span>
                )}
                {session?.status === 'canceled' && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    ✕ Cancelled
                  </span>
                )}
              </div>
              
              {/* Completion status for larger screens */}
              {session?.status === 'completed' && (
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className="text-sm font-medium text-green-600">Completed</span>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Tab Navigation - Mobile responsive with horizontal scroll */}
        <nav className="mb-4 sm:mb-8">
          {/* Mobile: Horizontal scrolling tabs */}
          <div className="flex overflow-x-auto scrollbar-hide space-x-2 sm:space-x-8 pb-2 sm:pb-0">
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
                  className={`flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
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
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  {/* Show only icon on very small screens */}
                  <span className="xs:hidden sm:hidden sr-only">{tab.label}</span>
                  {isDisabled && (
                    <span className="hidden sm:inline text-xs text-gray-400 ml-1">
                      ({session?.status === 'completed' ? 'Completed' : 'Cancelled'})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            session={session}
            currentUserId={currentUserId!}
            works={works}
            myProgress={myProgress}
            otherProgress={otherProgress}
            user={user}
            otherUserDetails={otherUserDetails}
            showAlert={(type: string, message: string, title?: string) => showAlert(type as 'success' | 'error' | 'warning' | 'info', message, title)}
            setActiveTab={(tab: string) => setActiveTab(tab as 'overview' | 'submit-work' | 'view-works' | 'progress' | 'report')}
            onSessionUpdate={refreshSessionData}
            token={token!}
          />
        )}

        {activeTab === 'submit-work' && (
          <SubmitWorkTab
            session={session}
            currentUserId={currentUserId!}
            formatDate={formatDate!}
            showAlert={(type: string, message: string) => showAlert(type as 'success' | 'error' | 'warning' | 'info', message)}
          />
        )}

        {activeTab === 'view-works' && (
          <ViewWorksTab
            session={session}
            currentUserId={currentUserId!}
            sessionId={sessionId!}
            showAlert={(type: string, message: string, title?: string) => showAlert(type as 'success' | 'error' | 'warning' | 'info', message, title)}
            onWorkUpdate={fetchWorks}
            otherUserDetails={otherUserDetails}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressTab
            sessionId={sessionId!}
            currentUserId={currentUserId!}
            session={session}
            user={user}
            showAlert={(type: string, message: string) => showAlert(type as 'success' | 'error' | 'warning' | 'info', message)}
          />
        )}

        {activeTab === 'report' && (
          <ReportTab
            session={session}
            currentUserId={currentUserId!}
            showAlert={(type: string, message: string) => showAlert(type as 'success' | 'error' | 'warning' | 'info', message)}
            formatDate={formatDate!}
            user={user}
            token={token!}
          />
        )}
      </main>

      {/* Work Review Modal - now handled in ViewWorksTab */}
      {/* Progress Update Modal - now integrated into ProgressTab component */}

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
