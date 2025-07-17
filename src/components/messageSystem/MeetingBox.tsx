import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Calendar, Plus } from 'lucide-react';
import CreateMeetingModal from '@/components/meetingSystem/CreateMeetingModal';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import MeetingList from '@/components/meetingSystem/MeetingList';
import Meeting from '@/types/meeting';
import { 
  fetchMeetings, 
  createMeeting, 
  updateMeeting, 
  cancelMeetingWithReason,
  fetchMeetingCancellation,
  acknowledgeMeetingCancellation,
  checkMeetingNotesExist,
  filterMeetingsByType,
  checkMeetingLimit
} from "@/services/meetingApiServices";
import { fetchChatRoom, fetchUserProfile } from "@/services/chatApiServices";
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import { debouncedApiService } from '@/services/debouncedApiService';
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

  // Use API service to filter meetings
  const filteredMeetings = filterMeetingsByType(meetings, userId);
  const hasActiveMeetingsOrRequests = filteredMeetings.pendingRequests.length > 0 || filteredMeetings.upcomingMeetings.length > 0;

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

  // Fetch user profiles for all meeting participants
  const fetchUserProfiles = useCallback(async (currentMeetings: Meeting[]) => {
    if (currentMeetings.length === 0) return;
    
    const uniqueUserIds = new Set<string>();
    currentMeetings.forEach(meeting => {
      uniqueUserIds.add(meeting.senderId);
      uniqueUserIds.add(meeting.receiverId);
    });

    // Fetch profiles for each unique user ID
    for (const id of uniqueUserIds) {
      const cacheKey = `profile-${id}`;
      
      try {
        const profileData = await debouncedApiService.makeRequest(
          cacheKey,
          async () => {
            return await fetchUserProfile(id);
          },
          60000 // 1 minute cache for profiles
        );
        
        if (profileData) {
          setUserProfiles(prev => {
            // Check if we already have this profile to prevent unnecessary updates
            if (prev[id] && 
                prev[id].firstName === profileData.firstName && 
                prev[id].lastName === profileData.lastName &&
                prev[id].avatar === profileData.avatar) {
              return prev; // No change needed
            }
            
            return {
              ...prev,
              [id]: {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                avatar: profileData.avatar
              }
            };
          });
        }
      } catch (err) {
        console.error(`Error fetching profile for user ${id}:`, err);
      }
    }
  }, []);

  // Fetch user profiles when meetings change (with debouncing)
  useEffect(() => {
    if (meetings.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      fetchUserProfiles(meetings);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [meetings, fetchUserProfiles]);

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

  // Create Meeting Function
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
        
        if (onMeetingUpdateRef.current) {
          onMeetingUpdateRef.current();
        }
      } else {
        showAlert('error', 'Failed to cancel meeting');
      }
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      showAlert('error', 'Failed to cancel meeting');
    }
  };

  // Show cancel modal
  const showCancelMeetingModal = (meetingId: string) => {
    setMeetingToCancel(meetingId);
    setShowCancelModal(true);
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading meetings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
        </div>
        <button 
          onClick={handleScheduleMeetingClick}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
          title="Schedule New Meeting"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <MeetingList
          pendingRequests={filteredMeetings.pendingRequests}
          upcomingMeetings={filteredMeetings.upcomingMeetings}
          pastMeetings={filteredMeetings.pastMeetings}
          cancelledMeetings={filteredMeetings.cancelledMeetings}
          hasActiveMeetingsOrRequests={hasActiveMeetingsOrRequests}
          showPastMeetings={showPastMeetings}
          showCancelledMeetings={showCancelledMeetings}
          userId={userId}
          userProfiles={userProfiles}
          meetingNotesStatus={meetingNotesStatus}
          checkingNotes={checkingNotes}
          onScheduleMeeting={handleScheduleMeetingClick}
          onMeetingAction={handleMeetingAction}
          onCancelMeeting={showCancelMeetingModal}
          onAlert={showAlert}
          onTogglePastMeetings={() => setShowPastMeetings(!showPastMeetings)}
          onToggleCancelledMeetings={() => setShowCancelledMeetings(!showCancelledMeetings)}
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateMeetingModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMeeting}
          receiverName={otherUserId ? userProfiles[otherUserId]?.firstName || 'User' : 'this user'}
        />
      )}

      {showCancelModal && meetingToCancel && (
        <CancelMeetingModal
          meetingId={meetingToCancel}
          onClose={() => {
            setShowCancelModal(false);
            setMeetingToCancel(null);
          }}
          onCancel={handleCancelMeeting}
          userName={otherUserId ? userProfiles[otherUserId]?.firstName || 'User' : 'User'}
        />
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