import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Calendar, Plus, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateMeetingModal from '@/components/meetingSystem/CreateMeetingModal';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import MeetingList from '@/components/meetingSystem/MeetingList';
import SavedNotesList from '@/components/meetingSystem/SavedNotesList';
import NotesViewModal from '@/components/meetingSystem/NotesViewModal';
import Meeting from '@/types/meeting';
import { 
  fetchMeetings, 
  createMeeting, 
  updateMeeting, 
  cancelMeetingWithReason,
  fetchMeetingCancellation,
  acknowledgeMeetingCancellation,
  checkMeetingNotesExist,
  fetchAllUserMeetingNotes,
  downloadMeetingNotesFile,
  filterMeetingsByType,
  checkMeetingLimit,
  canCancelMeeting
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

  // Animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      x: -20
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const headerVariants = {
    hidden: { 
      opacity: 0,
      y: -10
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        delay: 0.1
      }
    }
  };

  const buttonHover = {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  };

  const buttonTap = {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  };
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

  // Saved notes states
  const [savedNotes, setSavedNotes] = useState<MeetingNote[]>([]);
  const [loadingSavedNotes, setLoadingSavedNotes] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);

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

  // Use API service to filter meetings
  const filteredMeetings = filterMeetingsByType(meetings, userId);
  const hasActiveMeetingsOrRequests = filteredMeetings.pendingRequests.length > 0 || filteredMeetings.upcomingMeetings.length > 0 || currentlyHappeningMeetings.length > 0;

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
      // Create markdown content directly from the note data
      const meetingTitle = note.meetingInfo?.description || note.title;
      const meetingDate = note.meetingInfo?.meetingTime || note.createdAt;
      
      // Create a well-formatted markdown document
      const formattedDate = new Date(meetingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedTime = new Date(meetingDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Clean up the content
      let formattedContent = note.content
        .replace(/^## (.*$)/gm, '## $1')
        .replace(/^# (.*$)/gm, '# $1')
        .replace(/^> (.*$)/gm, '> $1')
        .replace(/^- (.*$)/gm, '- $1')
        .trim();

      const markdownDocument = `# Meeting Notes

---

## Meeting Information

- **Meeting:** ${note.title}
- **Date:** ${formattedDate}
- **Time:** ${formattedTime}
- **Meeting ID:** \`${note.meetingId}\`${note.meetingInfo?.isDeleted ? '\n- **Status:** ⚠️ Meeting Removed from System' : ''}

---

## Content

${formattedContent}

---

## Meeting Details

- **Word Count:** ${note.wordCount}
- **Tags:** ${note.tags?.join(', ') || 'None'}
- **Created:** ${new Date(note.createdAt).toLocaleDateString()}
- **Last Updated:** ${new Date(note.lastModified).toLocaleDateString()}
- **Privacy:** ${note.isPrivate ? 'Private' : 'Public'}${note.meetingInfo?.isDeleted ? '\n- **Note:** Original meeting has been removed from the system but notes are preserved' : ''}

---

*Generated by SkillSwap Hub - Meeting Notes System*
      `;
      
      // Create and trigger download
      const blob = new Blob([markdownDocument], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const fileName = `meeting-notes-${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date(meetingDate).toISOString().split('T')[0]}.md`;
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      
      // Add to DOM, click, and remove
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      showAlert('success', 'Notes downloaded successfully!');
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
        
        // Invalidate cache for both users
        if (otherUserId) {
          invalidateUsersCaches(userId, otherUserId);
        }
        
        if (onMeetingUpdateRef.current) {
          onMeetingUpdateRef.current();
        }
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
      <motion.div 
        className="p-6 text-center relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background pulse effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="relative z-10">
          <motion.div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 1, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <motion.p 
            className="mt-2 text-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Loading meetings...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Animated Background Elements */}
      <motion.div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
      >
        {/* Floating circles */}
        <motion.div
          className="absolute w-20 h-20 bg-blue-100 rounded-full"
          style={{ top: '10%', left: '5%' }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-16 h-16 bg-purple-100 rounded-full"
          style={{ top: '60%', right: '10%' }}
          animate={{
            y: [0, 15, 0],
            x: [0, -8, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute w-12 h-12 bg-green-100 rounded-full"
          style={{ bottom: '15%', left: '15%' }}
          animate={{
            y: [0, -10, 0],
            x: [0, 5, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </motion.div>

      <motion.div 
        className="p-4 h-full flex flex-col relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200"
          variants={headerVariants}
        >
          <motion.div 
            className="flex items-center space-x-3"
            variants={itemVariants}
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            >
              <Calendar className="w-5 h-5 text-blue-600" />
            </motion.div>
            <h2 className="text-lg font-semibold text-gray-900">Meetings</h2>
          </motion.div>
          <motion.button 
            onClick={handleScheduleMeetingClick}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
            title="Schedule New Meeting"
            variants={itemVariants}
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{ 
                duration: 0.5,
                ease: "easeInOut"
              }}
              whileHover={{ rotate: 90 }}
            >
              <Plus className="w-4 h-4" />
            </motion.div>
            <span>New</span>
          </motion.button>
        </motion.div>

        {/* Meetings List */}
        <motion.div 
          className="flex-1 overflow-y-auto space-y-4"
          variants={itemVariants}
        >
          <MeetingList
            pendingRequests={filteredMeetings.pendingRequests}
            upcomingMeetings={filteredMeetings.upcomingMeetings}
            pastMeetings={filteredMeetings.pastMeetings}
            cancelledMeetings={filteredMeetings.cancelledMeetings}
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
        </motion.div>

        {/* Saved Meeting Notes - Collapsible */}
        <motion.div 
          className="border-t border-gray-200 pt-4"
          variants={itemVariants}
        >
          <motion.div 
            className="border border-gray-200 rounded-lg overflow-hidden"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={() => setShowSavedNotes(!showSavedNotes)}
              className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
              whileHover={{ backgroundColor: "rgb(243 244 246)" }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <motion.div
                  animate={{ 
                    rotate: showSavedNotes ? [0, 10, -10, 0] : 0,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                >
                  <FileText className="w-4 h-4 mr-2 text-purple-500" />
                </motion.div>
                <span>Saved Meeting Notes ({savedNotes.length})</span>
              </div>
              <motion.div
                animate={{ rotate: showSavedNotes ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {showSavedNotes ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {showSavedNotes && (
                <motion.div 
                  className="p-4 bg-white"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <SavedNotesList
                    notes={savedNotes}
                    loading={loadingSavedNotes}
                    onViewNotes={handleViewNotes}
                    onDownloadNotes={handleDownloadNotes}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CreateMeetingModal
              onClose={() => setShowCreateModal(false)}
              onCreate={handleCreateMeeting}
              receiverName={otherUserId ? userProfiles[otherUserId]?.firstName || 'User' : 'this user'}
            />
          </motion.div>
        )}

        {showCancelModal && meetingToCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CancelMeetingModal
              meetingId={meetingToCancel}
              onClose={() => {
                setShowCancelModal(false);
                setMeetingToCancel(null);
              }}
              onCancel={handleCancelMeeting}
              userName={otherUserId ? userProfiles[otherUserId]?.firstName || 'User' : 'User'}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
      <AnimatePresence>
        {showNotesModal && selectedNote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <NotesViewModal
              note={selectedNote}
              onClose={() => {
                setShowNotesModal(false);
                setSelectedNote(null);
              }}
              onDownload={handleDownloadNotes}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}