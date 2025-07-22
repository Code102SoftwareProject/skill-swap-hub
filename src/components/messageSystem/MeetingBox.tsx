import { useEffect, useState, useCallback, useRef } from 'react';
import { Calendar, Plus, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import CreateMeetingModal from '@/components/meetingSystem/CreateMeetingModal';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import CancellationAlert from '@/components/meetingSystem/CancellationAlert';
import MeetingList from '@/components/meetingSystem/MeetingList';
import SavedNotesList from '@/components/meetingSystem/SavedNotesList';
import NotesViewModal from '@/components/meetingSystem/NotesViewModal';
import Meeting from '@/types/meeting';
import { generateMeetingNotesPDF, MeetingNotePDFData } from '@/utils/pdfHandler';
import { 
  fetchMeetings, 
  createMeeting, 
  updateMeeting, 
  cancelMeetingWithReason,
  fetchMeetingCancellation,
  acknowledgeMeetingCancellation,
  fetchUnacknowledgedCancellations,
  checkMeetingNotesExist,
  fetchAllUserMeetingNotes,
  downloadMeetingNotesFile,
  filterMeetingsByType,
  checkMeetingLimit,
  canCancelMeeting
} from "@/services/meetingApiServices";
import { fetchChatRoom, fetchUserProfile } from "@/services/chatApiServices";
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import { imageOptimizationService } from '@/services/imageOptimizationService';
import { useBatchAvatarPreload } from '@/hooks/useOptimizedAvatar';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface UserProfiles {
  [userId: string]: UserProfile;
}

interface CancellationAlert {
  _id: string;
  meetingId: string;
  reason: string;
  cancelledAt: string;
  cancellerName: string;
  meetingTime: string;
  meetingDescription?: string;
}

interface MeetingNote {
  _id: string;
  meetingId: string;
  title: string;
  content: string;
  tags: string[];
  wordCount: number;
  lastModified: string;
  createdAt: string;
  isPrivate: boolean;
  meetingInfo?: {
    description: string;
    meetingTime: string;
    senderId: string;
    receiverId: string;
    isDeleted?: boolean;
  };
}

interface MeetingBoxProps {
  chatRoomId: string;
  userId: string;
  onClose: () => void;
  onMeetingUpdate?: () => void;
}

export default function MeetingBox({ chatRoomId, userId, onClose, onMeetingUpdate }: MeetingBoxProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<UserProfiles>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [showPastMeetings, setShowPastMeetings] = useState(false);
  const [showCancelledMeetings, setShowCancelledMeetings] = useState(false);
  const [meetingNotesStatus, setMeetingNotesStatus] = useState<{[meetingId: string]: boolean}>({});
  const [checkingNotes, setCheckingNotes] = useState<{[meetingId: string]: boolean}>({});
  const [actionLoadingStates, setActionLoadingStates] = useState<{[meetingId: string]: string}>({});

  // Cancellation alerts state
  const [cancellationAlerts, setCancellationAlerts] = useState<CancellationAlert[]>([]);
  const [loadingCancellationAlerts, setLoadingCancellationAlerts] = useState(false);

  // Saved notes states
  const [savedNotes, setSavedNotes] = useState<MeetingNote[]>([]);
  const [loadingSavedNotes, setLoadingSavedNotes] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Use batch avatar preloading hook like Sidebar does
  const { preloadAvatars } = useBatchAvatarPreload();

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

  // Helper functions for alerts 
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

  // Fetch cancellation alerts for the current user from the specific other user
  const fetchCancellationAlerts = useCallback(async () => {
    if (!userId || !otherUserId) return;
    
    try {
      setLoadingCancellationAlerts(true);
      const alerts = await fetchUnacknowledgedCancellations(userId);
      
      // Filter alerts to only show cancellations from the current chat partner
      const filteredAlerts = (alerts || []).filter((alert: CancellationAlert) => {
        // Check if this cancellation is related to a meeting with the current other user
        // We can match by checking if the meeting involves both users
        return meetings.some(meeting => 
          meeting._id === alert.meetingId && 
          (
            (meeting.senderId === userId && meeting.receiverId === otherUserId) ||
            (meeting.senderId === otherUserId && meeting.receiverId === userId)
          )
        );
      });
      
      setCancellationAlerts(filteredAlerts);
    } catch (error) {
      console.error('Error fetching cancellation alerts:', error);
      setCancellationAlerts([]);
    } finally {
      setLoadingCancellationAlerts(false);
    }
  }, [userId, otherUserId, meetings]);

  // Handle acknowledging a cancellation
  const handleAcknowledgeCancellation = async (cancellationId: string) => {
    try {
      setLoadingCancellationAlerts(true);
      await acknowledgeMeetingCancellation(cancellationId, userId);
      
      // Remove the acknowledged cancellation from the list
      setCancellationAlerts(prev => 
        prev.filter(alert => alert._id !== cancellationId)
      );
      
      showAlert('success', 'Cancellation acknowledged successfully');
    } catch (error) {
      console.error('Error acknowledging cancellation:', error);
      showAlert('error', 'Failed to acknowledge cancellation');
    } finally {
      setLoadingCancellationAlerts(false);
    }
  };

  // Check if a meeting is currently happening (in non-cancellation period)
  const isMeetingHappening = (meeting: Meeting): boolean => {
    if (meeting.state !== 'accepted') return false;
    
    const now = new Date();
    const meetingTime = new Date(meeting.meetingTime);
    const tenMinutesBefore = new Date(meetingTime.getTime() - 10 * 60 * 1000); // 10 minutes before
    const thirtyMinutesAfter = new Date(meetingTime.getTime() + 30 * 60 * 1000); // 30 minutes after
    
    return now >= tenMinutesBefore && now <= thirtyMinutesAfter;
  };

  // Get meetings that are currently happening
  const currentlyHappeningMeetings = meetings.filter(isMeetingHappening);

  // Get meetings excluding currently happening ones for other categories
  const meetingsExcludingCurrent = meetings.filter(meeting => !isMeetingHappening(meeting));

  // Update meeting statuses every minute to refresh currently happening meetings
  useEffect(() => {
    if (meetings.length === 0) return;
    
    const interval = setInterval(() => {
      // Force a re-render to update currently happening meetings
      // The isMeetingHappening function will recalculate based on current time
      setMeetings(prevMeetings => [...prevMeetings]);
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [meetings.length]);

  // Use API service to filter meetings (excluding currently happening ones)
  const filteredMeetings = filterMeetingsByType(meetingsExcludingCurrent, userId);
  
  // Additional filtering to ensure no overlap between currently happening and upcoming
  const cleanedUpcomingMeetings = filteredMeetings.upcomingMeetings.filter(meeting => !isMeetingHappening(meeting));
  
  const finalFilteredMeetings = {
    ...filteredMeetings,
    upcomingMeetings: cleanedUpcomingMeetings
  };
  
  const hasActiveMeetingsOrRequests = finalFilteredMeetings.pendingRequests.length > 0 || finalFilteredMeetings.upcomingMeetings.length > 0 || currentlyHappeningMeetings.length > 0;

  // Track if meetings have been loaded to prevent duplicate onMeetingUpdate calls
  const hasFetchedMeetings = useRef(false);
  const onMeetingUpdateRef = useRef(onMeetingUpdate);
  
  // Update the ref when the callback changes
  useEffect(() => {
    onMeetingUpdateRef.current = onMeetingUpdate;
  }, [onMeetingUpdate]);

  // Fetch chat room to get other user ID
  useEffect(() => {
    const loadChatRoom = async () => {
      try {
        const chatRoom = await fetchChatRoom(chatRoomId);
        
        if (chatRoom && chatRoom.participants) {
          const otherParticipant = chatRoom.participants.find(
            (id: string) => id !== userId
          );
          if (otherParticipant) {
            setOtherUserId(otherParticipant);
          }
        }
      } catch (error) {
        console.error("Error fetching chat room:", error);
      }
    };
    
    if (chatRoomId && userId) {
      loadChatRoom();
    }
  }, [chatRoomId, userId]);

  // Fetch meetings when otherUserId is available
  useEffect(() => {
    if (!otherUserId) return;
    
    const loadMeetings = async () => {
      try {
        setLoading(true);
        const data = await fetchMeetings(userId, otherUserId);
        setMeetings(data);

        // Notify parent component about meeting updates (only once per mount)
        if (onMeetingUpdateRef.current && !hasFetchedMeetings.current) {
          hasFetchedMeetings.current = true;
          onMeetingUpdateRef.current();
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    hasFetchedMeetings.current = false; // Reset for new otherUserId
    loadMeetings();
  }, [otherUserId, userId]);

  // Fetch cancellation alerts when userId, otherUserId, or meetings change
  useEffect(() => {
    if (userId && otherUserId && meetings.length > 0) {
      fetchCancellationAlerts();
    }
  }, [userId, otherUserId, meetings.length, fetchCancellationAlerts]);

  // Fetch user profiles for all meeting participants (matching Sidebar approach exactly)
  const fetchUserProfiles = useCallback(async (currentMeetings: Meeting[]) => {
    if (currentMeetings.length === 0) return;
    
    const uniqueUserIds = new Set<string>();
    currentMeetings.forEach(meeting => {
      uniqueUserIds.add(meeting.senderId);
      uniqueUserIds.add(meeting.receiverId);
    });

    if (uniqueUserIds.size === 0) return;

    console.log(`Fetching profiles for ${uniqueUserIds.size} users in MeetingBox`);
    
    // Clear image cache to ensure fresh avatar loading
    imageOptimizationService.clearCache();
    console.log('Cleared image cache for fresh avatar loading');

    // Prepare data for batch avatar preloading
    const avatarData: Array<{
      userId: string;
      firstName?: string;
      avatarUrl?: string;
    }> = [];

    // Fetch each profile individually - exactly like Sidebar does
    for (const id of uniqueUserIds) {
      try {
        const userData = await fetchUserProfile(id);

        if (userData) {
          console.log(`Profile fetched for user ${id}:`, userData);
          setUserProfiles((prev) => ({
            ...prev,
            [id]: userData, // Store complete userData object like Sidebar
          }));

          // Add to avatar preload data
          avatarData.push({
            userId: id,
            firstName: userData.firstName,
            avatarUrl: userData.avatar
          });
        } else {
          console.log(`No profile found for user ${id}, setting fallback`);
          setUserProfiles((prev) => ({
            ...prev,
            [id]: {
              firstName: "Unknown",
              lastName: "User",
            },
          }));
        }
      } catch (err) {
        console.error(`Error fetching profile for user ${id}:`, err);
        setUserProfiles((prev) => ({
          ...prev,
          [id]: {
            firstName: "Unknown",
            lastName: "User",
          },
        }));
      }
    }

    // Batch preload avatars for better performance - like Sidebar does
    if (avatarData.length > 0) {
      try {
        await preloadAvatars(avatarData, 'small');
        console.log(`Preloaded ${avatarData.length} avatars in MeetingBox`);
      } catch (error) {
        console.warn('Avatar preloading failed in MeetingBox:', error);
      }
    }
  }, [preloadAvatars]);

  // Fetch user profiles when meetings change (like Sidebar does)
  useEffect(() => {
    if (meetings.length > 0) {
      fetchUserProfiles(meetings);
    }
  }, [fetchUserProfiles, meetings]);

  // Check if notes exist for meetings
  const checkMeetingNotes = useCallback(async (currentMeetings: Meeting[]) => {
    const pastAndCompletedMeetings = currentMeetings.filter(m => 
      (m.state === 'completed' || m.state === 'accepted') && 
      new Date(m.meetingTime) <= new Date()
    );

    if (pastAndCompletedMeetings.length === 0) {
      setMeetingNotesStatus({});
      setCheckingNotes({});
      return;
    }

    const notesStatus: {[meetingId: string]: boolean} = {};
    const checking: {[meetingId: string]: boolean} = {};

    // Set all meetings as checking initially
    pastAndCompletedMeetings.forEach(meeting => {
      checking[meeting._id] = true;
    });
    setCheckingNotes(checking);

    // Check notes for each meeting with caching
    for (const meeting of pastAndCompletedMeetings) {
      try {
        const hasNotes = await checkMeetingNotesExist(meeting._id, userId);
        notesStatus[meeting._id] = hasNotes;
      } catch (error) {
        console.error(`Error checking notes for meeting ${meeting._id}:`, error);
        notesStatus[meeting._id] = false;
      } finally {
        checking[meeting._id] = false;
      }
    }

    setMeetingNotesStatus(notesStatus);
    setCheckingNotes(checking);
  }, [userId]);

  // Fetch saved notes when otherUserId is available
  const fetchSavedNotes = useCallback(async () => {
    if (!otherUserId) return;
    
    try {
      setLoadingSavedNotes(true);
      const notes = await fetchAllUserMeetingNotes(userId, otherUserId);
      setSavedNotes(notes || []);
    } catch (error) {
      console.error('Error fetching saved notes:', error);
      setSavedNotes([]);
    } finally {
      setLoadingSavedNotes(false);
    }
  }, [userId, otherUserId]);

  // Fetch saved notes when otherUserId changes
  useEffect(() => {
    if (otherUserId) {
      fetchSavedNotes();
    }
  }, [otherUserId, fetchSavedNotes]);

  // Handle viewing notes
  const handleViewNotes = (note: MeetingNote) => {
    setSelectedNote(note);
    setShowNotesModal(true);
  };

  // Handle downloading notes
  const handleDownloadNotes = async (note: MeetingNote) => {
    try {
      // Get the other user's name
      const otherUserName = otherUserId && userProfiles[otherUserId] 
        ? `${userProfiles[otherUserId].firstName} ${userProfiles[otherUserId].lastName}`.trim()
        : 'User';
      
      const pdfData: MeetingNotePDFData = {
        title: note.title,
        content: note.content,
        meetingId: note.meetingId,
        createdAt: note.createdAt,
        lastModified: note.lastModified,
        wordCount: note.wordCount,
        tags: note.tags,
        isPrivate: note.isPrivate,
        otherUserName: otherUserName,
        meetingInfo: note.meetingInfo
      };
      
      generateMeetingNotesPDF(pdfData);
      showAlert('success', 'Notes downloaded successfully as PDF!');
    } catch (error: any) {
      console.error('Error downloading notes:', error);
      showAlert('error', 'Failed to download notes');
    }
  };

  // Check for notes when meetings change
  useEffect(() => {
    if (meetings.length === 0) {
      setMeetingNotesStatus({});
      setCheckingNotes({});
      return;
    }

    const timeoutId = setTimeout(() => {
      checkMeetingNotes(meetings);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [meetings, checkMeetingNotes]);

  // Meeting action handler
  const handleMeetingAction = async (meetingId: string, action: 'accept' | 'reject' | 'cancel') => {
    // Prevent multiple clicks by checking if action is already in progress
    if (actionLoadingStates[meetingId]) {
      return;
    }

    const actionText = action === 'accept' ? 'accept' : action === 'reject' ? 'decline' : 'cancel';
    const confirmationTitle = action === 'accept' ? 'Accept Meeting' : 
                             action === 'reject' ? 'Decline Meeting' : 'Cancel Meeting';
    const confirmationMessage = `Are you sure you want to ${actionText} this meeting request?`;
    const confirmationType = action === 'reject' || action === 'cancel' ? 'warning' : 'info';

    showConfirmation(
      confirmationTitle,
      confirmationMessage,
      async () => {
        try {
          // Set loading state for this specific meeting and action
          setActionLoadingStates(prev => ({ ...prev, [meetingId]: action }));
          
          const updatedMeeting = await updateMeeting(meetingId, action);
          
          if (updatedMeeting) {
            setMeetings(prevMeetings => 
              prevMeetings.map(meeting => 
                meeting._id === meetingId ? updatedMeeting : meeting
              )
            );
            showAlert('success', `Meeting ${actionText}ed successfully!`);
          }
          
          // Invalidate cache for both users
          if (otherUserId) {
            invalidateUsersCaches(userId, otherUserId);
          }
          
          // Notify parent component about meeting updates
          if (onMeetingUpdateRef.current) {
            onMeetingUpdateRef.current();
          }
        } catch (error) {
          console.error(`Error ${action}ing meeting:`, error);
          showAlert('error', `Failed to ${actionText} meeting`);
        } finally {
          // Clear loading state
          setActionLoadingStates(prev => {
            const newState = { ...prev };
            delete newState[meetingId];
            return newState;
          });
        }
      },
      confirmationType,
      actionText.charAt(0).toUpperCase() + actionText.slice(1)
    );
  };

  // Handle Schedule Meeting button click with validation
  const handleScheduleMeetingClick = () => {
    const activeMeetingCount = checkMeetingLimit(meetings);
    
    if (activeMeetingCount >= 2) {
      showAlert(
        'warning', 
        'You can only have a maximum of 2 active meetings (pending or scheduled) with this user at a time. Please wait for existing meetings to be completed or cancelled before scheduling new ones.',
        'Meeting Limit Reached'
      );
      return;
    }
    
    setShowCreateModal(true);
  };

  //* Create Meeting Function
  const handleCreateMeeting = async (meetingData: any) => {
    if (!otherUserId) return;
    
    try {
      const newMeeting = await createMeeting({
        senderId: userId,
        receiverId: otherUserId,
        description: meetingData.description,
        meetingTime: new Date(meetingData.date + 'T' + meetingData.time)
      });
      
      if (newMeeting) {
        setMeetings(prevMeetings => [...prevMeetings, newMeeting]);
        setShowCreateModal(false);
        showAlert('success', 'Meeting request sent successfully!');
        
        // Notify parent component about meeting updates
        if (onMeetingUpdateRef.current) {
          onMeetingUpdateRef.current();
        }
      }
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      const errorMessage = error.message || 'Failed to create meeting request';
      showAlert('error', errorMessage);
      
      if (errorMessage.includes('maximum of 2 active meetings')) {
        setShowCreateModal(false);
      }
    }
  };

  // Handle meeting cancellation with reason
  const handleCancelMeeting = async (meetingId: string, reason: string) => {
    try {
      const meeting = await cancelMeetingWithReason(meetingId, userId, reason);

      if (meeting) {
        setMeetings(prevMeetings =>
          prevMeetings.map(m => m._id === meetingId ? meeting : m)
        );

        setShowCancelModal(false);
        setMeetingToCancel(null);
        showAlert('success', 'Meeting cancelled successfully');
        
        // Invalidate cache for both users
        if (otherUserId) {
          invalidateUsersCaches(userId, otherUserId);
        }
        
        if (onMeetingUpdateRef.current) {
          onMeetingUpdateRef.current();
        }
        
        // Refresh cancellation alerts in case there are new ones
        fetchCancellationAlerts();
      } else {
        showAlert('error', 'Failed to cancel meeting');
      }
    } catch (error: any) {
      console.error('Error cancelling meeting:', error);
      const errorMessage = error.message || 'Failed to cancel meeting';
      showAlert('error', errorMessage);
    }
  };

  // Show cancel modal
  const showCancelMeetingModal = (meetingId: string) => {
    // Find the meeting to check if it can be cancelled
    const meeting = meetings.find(m => m._id === meetingId);
    if (!meeting) {
      showAlert('error', 'Meeting not found');
      return;
    }

    // Check if meeting can be cancelled
    const { canCancel, reason } = canCancelMeeting(meeting);
    if (!canCancel) {
      showAlert('warning', reason!, 'Cannot Cancel Meeting');
      return;
    }

    setMeetingToCancel(meetingId);
    setShowCancelModal(true);
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="p-6 text-center relative">
        {/* Background pulse effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg opacity-30" />
        
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-500">
            Loading meetings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 h-full flex flex-col relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
          </div>
          <button 
            onClick={handleScheduleMeetingClick}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
            title="Schedule New Meeting"
          >
            <div>
              <Plus className="w-4 h-4" />
            </div>
            <span>New</span>
          </button>
        </div>

        {/* Cancellation Alerts */}
        {cancellationAlerts.length > 0 && (
          <div className="mb-4">
            <div className="space-y-2">
              {cancellationAlerts.map((cancellation) => (
                <CancellationAlert
                  key={cancellation._id}
                  cancellation={cancellation}
                  onAcknowledge={handleAcknowledgeCancellation}
                  loading={loadingCancellationAlerts}
                />
              ))}
            </div>
          </div>
        )}

        {/* Meetings List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          <MeetingList
            pendingRequests={finalFilteredMeetings.pendingRequests}
            upcomingMeetings={finalFilteredMeetings.upcomingMeetings}
            pastMeetings={finalFilteredMeetings.pastMeetings}
            cancelledMeetings={finalFilteredMeetings.cancelledMeetings}
            currentlyHappeningMeetings={currentlyHappeningMeetings}
            hasActiveMeetingsOrRequests={hasActiveMeetingsOrRequests}
            showPastMeetings={showPastMeetings}
            showCancelledMeetings={showCancelledMeetings}
            userId={userId}
            userProfiles={userProfiles}
            meetingNotesStatus={meetingNotesStatus}
            checkingNotes={checkingNotes}
            actionLoadingStates={actionLoadingStates}
            onScheduleMeeting={handleScheduleMeetingClick}
            onMeetingAction={handleMeetingAction}
            onCancelMeeting={showCancelMeetingModal}
            onAlert={showAlert}
            onTogglePastMeetings={() => setShowPastMeetings(!showPastMeetings)}
            onToggleCancelledMeetings={() => setShowCancelledMeetings(!showCancelledMeetings)}
          />
        </div>

        {/* Saved Meeting Notes - Collapsible */}
        <div className="border-t border-gray-200 pt-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowSavedNotes(!showSavedNotes)}
              className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <div>
                  <FileText className="w-4 h-4 mr-2 text-purple-500" />
                </div>
                <span>Saved Meeting Notes ({savedNotes.length})</span>
              </div>
              <div>
                {showSavedNotes ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>
            {showSavedNotes && (
              <div className="p-4 bg-white">
                <SavedNotesList
                  notes={savedNotes}
                  loading={loadingSavedNotes}
                  onViewNotes={handleViewNotes}
                  onDownloadNotes={handleDownloadNotes}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div>
          <CreateMeetingModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateMeeting}
            receiverName={otherUserId ? userProfiles[otherUserId]?.firstName || 'User' : 'this user'}
          />
        </div>
      )}

      {showCancelModal && meetingToCancel && (
        <div>
          <CancelMeetingModal
            meetingId={meetingToCancel}
            onClose={() => {
              setShowCancelModal(false);
              setMeetingToCancel(null);
            }}
            onCancel={handleCancelMeeting}
            userName={otherUserId ? userProfiles[otherUserId]?.firstName || 'User' : 'User'}
          />
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

      {/* Notes View Modal */}
      {showNotesModal && selectedNote && (
        <div>
          <NotesViewModal
            note={selectedNote}
            onClose={() => {
              setShowNotesModal(false);
              setSelectedNote(null);
            }}
            onDownload={handleDownloadNotes}
          />
        </div>
      )}
    </>
  );
}