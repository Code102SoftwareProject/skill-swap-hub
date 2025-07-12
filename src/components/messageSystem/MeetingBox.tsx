import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Plus, AlertCircle, Clock, ChevronDown, ChevronRight, Calendar, CheckCircle, XCircle, Download, Video, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateMeetingModal from '@/components/meetingSystem/CreateMeetingModal';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import Meeting from '@/types/meeting';
import { fetchMeetings, createMeeting, updateMeeting } from "@/services/meetingApiServices";
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import { debouncedApiService } from '@/services/debouncedApiService';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { processAvatarUrl, getFirstLetter } from "@/utils/avatarUtils";

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
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<UserProfiles>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [cancellationAlerts, setCancellationAlerts] = useState<CancellationAlert[]>([]);
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

  // Filter meetings to show only active/pending at the top
  const pendingRequests = meetings.filter(m => 
    m.state === 'pending' && m.receiverId === userId && !m.acceptStatus
  );
  
  const upcomingMeetings = meetings.filter(m => 
    (m.state === 'accepted' || (m.state === 'pending' && m.senderId === userId)) && 
    new Date(m.meetingTime) > new Date()
  );

  // Past meetings (completed or past due)
  const pastMeetings = meetings.filter(m => 
    (m.state === 'completed' || m.state === 'accepted') && 
    new Date(m.meetingTime) <= new Date()
  );

  // Cancelled meetings
  const cancelledMeetings = meetings.filter(m => 
    m.state === 'cancelled' || m.state === 'rejected'
  );

  // Check if there are any active meetings or requests
  const hasActiveMeetingsOrRequests = pendingRequests.length > 0 || upcomingMeetings.length > 0;

  // Track if meetings have been loaded to prevent duplicate onMeetingUpdate calls
  const hasFetchedMeetings = useRef(false);
  // Store the callback in a ref to avoid dependency issues
  const onMeetingUpdateRef = useRef(onMeetingUpdate);
  
  // Update the ref when the callback changes
  useEffect(() => {
    onMeetingUpdateRef.current = onMeetingUpdate;
  }, [onMeetingUpdate]);

  // Fetch chat room to get other user ID
  useEffect(() => {
    const fetchChatRoom = async () => {
      try {
        const response = await fetch(`/api/chatrooms?chatRoomId=${chatRoomId}`);
        const data = await response.json();
        
        if (data.success && data.chatRooms && data.chatRooms.length > 0) {
          const chatRoom = data.chatRooms[0];
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
      fetchChatRoom();
    }
  }, [chatRoomId, userId]);

  // Fetch meetings when otherUserId is available
  useEffect(() => {
    if (!otherUserId) return;
    
    // Call fetchMeetings directly to avoid callback dependency
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

  // Fetch meetings data
  const fetchMeetingsData = useCallback(async (otherUserID: string) => {
    try {
      setLoading(true);
      const data = await fetchMeetings(userId, otherUserID);
      setMeetings(data);

      // Notify parent component about meeting updates
      if (onMeetingUpdateRef.current) {
        onMeetingUpdateRef.current();
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch user profiles for all meeting participants with stable dependencies
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
            const res = await fetch(`/api/users/profile?id=${id}`);
            const data = await res.json();
            return data.success ? data.user : null;
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
    
    // Debounce the call to prevent excessive API requests
    const timeoutId = setTimeout(() => {
      fetchUserProfiles(meetings);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [meetings, fetchUserProfiles]); // Include meetings dependency

  // Fetch recent cancellations with stable dependencies
  const fetchRecentCancellations = useCallback(async (currentMeetings: Meeting[]) => {
    const cancelledMeetings = currentMeetings.filter(m => m.state === 'cancelled');
    if (cancelledMeetings.length === 0) {
      setCancellationAlerts([]);
      return;
    }

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentCancellations: CancellationAlert[] = [];

    // Process each cancelled meeting
    for (const meeting of cancelledMeetings) {
      const cacheKey = `cancellation-${meeting._id}`;
      
      try {
        const cancellationData = await debouncedApiService.makeRequest(
          cacheKey,
          async () => {
            const response = await fetch(`/api/meeting/cancellation?meetingId=${meeting._id}&userId=${userId}`);
            if (!response.ok) return null;
            return await response.json();
          },
          300000
        );

        if (cancellationData) {
          const cancelledAt = new Date(cancellationData.cancelledAt);
          
          if (cancelledAt > oneDayAgo) {
            let cancellerName = 'Someone';
            if (cancellationData.cancelledBy) {
              const profileCacheKey = `profile-${cancellationData.cancelledBy}`;
              try {
                const profileData = await debouncedApiService.makeRequest(
                  profileCacheKey,
                  async () => {
                    const res = await fetch(`/api/users/profile?id=${cancellationData.cancelledBy}`);
                    const data = await res.json();
                    return data.success ? data.user : null;
                  },
                  60000
                );
                if (profileData) {
                  cancellerName = profileData.firstName || 'Someone';
                }
              } catch (err) {
                console.error('Error fetching canceller profile:', err);
              }
            }
            
            recentCancellations.push({
              _id: cancellationData._id,
              meetingId: meeting._id,
              reason: cancellationData.reason,
              cancelledAt: cancellationData.cancelledAt,
              cancellerName,
              meetingTime: meeting.meetingTime.toString()
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching cancellation for ${meeting._id}:`, error);
      }
    }

    setCancellationAlerts(recentCancellations);
  }, [userId]);

  // Call fetch recent cancellations when meetings change (with debouncing)
  useEffect(() => {
    if (meetings.length === 0) {
      setCancellationAlerts([]);
      return;
    }

    // Debounce the call to prevent excessive API requests
    const timeoutId = setTimeout(() => {
      fetchRecentCancellations(meetings);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [meetings, fetchRecentCancellations]); // Include meetings dependency

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
      const cacheKey = `notes-check-${meeting._id}-${userId}`;
      
      try {
        const hasNotes = await debouncedApiService.makeRequest(
          cacheKey,
          async () => {
            const response = await fetch(`/api/meeting-notes?meetingId=${meeting._id}&userId=${userId}`);
            const data = await response.json();
            return response.ok && data._id && data.content && data.content.trim().length > 0;
          },
          300000 // Cache for 5 minutes
        );
        
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
          
          // Only refresh meetings list if it's an accept action and we need latest data
          if (action === 'accept' && otherUserId) {
            // Small delay to ensure state is updated before fetching
            setTimeout(() => {
              fetchMeetingsData(otherUserId);
            }, 100);
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
        
        // Invalidate cache for both users
        if (otherUserId) {
          invalidateUsersCaches(userId, otherUserId);
        }
        
        // Notify parent component about meeting updates
        if (onMeetingUpdateRef.current) {
          onMeetingUpdateRef.current();
        }
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      showAlert('error', 'Failed to create meeting request');
    }
  };

  // Handle meeting cancellation with reason
  const handleCancelMeeting = async (meetingId: string, reason: string) => {
    try {
      const response = await fetch('/api/meeting/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          cancelledBy: userId,
          reason
        }),
      });

      if (!response.ok) {
        throw new Error(`Error cancelling meeting: ${response.status}`);
      }

      const { meeting } = await response.json();

      // Update meetings state
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
      
      // Notify parent component about meeting updates
      if (onMeetingUpdateRef.current) {
        onMeetingUpdateRef.current();
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

  // Handle dismissing cancellation alert (save to database)
  const handleDismissCancellation = async (meetingId: string) => {
    try {
      // Find the cancellation alert to get the ID
      const alert = cancellationAlerts.find(alert => alert.meetingId === meetingId);
      
      if (!alert) {
        showAlert('error', 'Cancellation alert not found');
        return;
      }

      // Acknowledge the cancellation in the database
      const response = await fetch('/api/meeting/cancellation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellationId: alert._id,
          acknowledgedBy: userId
        }),
      });

      if (response.ok) {
        // Remove from cancellation alerts
        setCancellationAlerts(prev => prev.filter(alert => alert.meetingId !== meetingId));
        
        // Also invalidate the cache for this cancellation
        const cacheKey = `cancellation-${meetingId}`;
        debouncedApiService.invalidate(cacheKey);
      } else {
        showAlert('error', 'Failed to acknowledge cancellation');
      }
    } catch (error) {
      console.error('Error acknowledging cancellation:', error);
      showAlert('error', 'Failed to acknowledge cancellation');
    }
  };

  // Download notes for a meeting
  const downloadMeetingNotes = async (meetingId: string, meetingTitle: string, meetingDate: string) => {
    try {
      const response = await fetch(`/api/meeting-notes?meetingId=${meetingId}&userId=${userId}`);
      const data = await response.json();
      
      if (response.ok && data._id && data.content && data.content.trim().length > 0) {
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

        // Keep markdown formatting intact and clean it up
        let formattedContent = data.content
          .replace(/^## (.*$)/gm, '## $1')  // Ensure proper heading format
          .replace(/^# (.*$)/gm, '# $1')    // Ensure proper heading format
          .replace(/^> (.*$)/gm, '> $1')    // Ensure proper quote format
          .replace(/^- (.*$)/gm, '- $1')    // Ensure proper list format
          .trim();

        const wordCount = data.content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
        
        const markdownDocument = `# Meeting Notes

---

## Meeting Information

- **Meeting:** ${data.title || meetingTitle}
- **Date:** ${formattedDate}
- **Time:** ${formattedTime}
- **Meeting ID:** \`${meetingId}\`
- **Author:** ${data.userName || 'Unknown'}

---

## Content

${formattedContent}

---

## Meeting Details

- **Word Count:** ${wordCount}
- **Tags:** ${data.tags?.join(', ') || 'None'}
- **Created:** ${new Date(data.createdAt || meetingDate).toLocaleDateString()}
- **Last Updated:** ${data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'N/A'}

---

*Generated by SkillSwap Hub - Meeting Notes System*
        `;
        
        const blob = new Blob([markdownDocument], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-notes-${meetingId}-${new Date(meetingDate).toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert('success', 'Notes downloaded successfully as Markdown file!');
      } else {
        showAlert('info', 'No notes found for this meeting');
      }
    } catch (error) {
      console.error('Error downloading notes:', error);
      showAlert('error', 'Failed to download notes');
    }
  };

  // Function to refresh notes status for a specific meeting
  const refreshNotesStatus = useCallback((meetingId: string) => {
    const cacheKey = `notes-check-${meetingId}-${userId}`;
    debouncedApiService.invalidate(cacheKey);
    
    // Re-check notes for this meeting
    checkMeetingNotes(meetings);
  }, [userId, meetings, checkMeetingNotes]);

  // Format date and time utilities
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle join meeting button click
  const handleJoinMeeting = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`);
  };

  // Get user display name
  const getUserDisplayName = (userId: string): string => {
    const profile = userProfiles[userId];
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.firstName || 'User';
  };

  // Get user avatar URL
  const getUserAvatar = (userId: string): string | undefined => {
    const rawAvatarUrl = userProfiles[userId]?.avatar;
    return processAvatarUrl(rawAvatarUrl);
  };

  // Get first letter for fallback
  const getUserFirstLetter = (userId: string): string => {
    const profile = userProfiles[userId];
    return getFirstLetter(profile?.firstName, userId);
  };

  // Meeting status utilities
  const getStatusColor = (meeting: Meeting) => {
    switch (meeting.state) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (meeting: Meeting) => {
    if (meeting.state === 'pending' && meeting.senderId === userId) {
      return 'Awaiting Response';
    }
    return meeting.state.charAt(0).toUpperCase() + meeting.state.slice(1);
  };

  // Separate Avatar Component to maintain stable state
  const MeetingAvatar = React.memo(({ userId, userName }: { userId: string; userName: string }) => {
    const avatarUrl = getUserAvatar(userId);
    const firstLetter = getUserFirstLetter(userId);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(!!avatarUrl);

    // Reset states when avatar changes
    useEffect(() => {
      if (avatarUrl) {
        setImageError(false);
        setImageLoading(true);
      } else {
        setImageError(false);
        setImageLoading(false);
      }
    }, [avatarUrl]);

    const handleImageError = () => {
      setImageError(true);
      setImageLoading(false);
    };

    const handleImageLoad = () => {
      setImageLoading(false);
    };

    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
        {avatarUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute w-8 h-8 rounded-full bg-gray-300 animate-pulse flex items-center justify-center">
                <span className="text-xs text-gray-500">...</span>
              </div>
            )}
            <img
              src={avatarUrl}
              alt={userName}
              className={`w-8 h-8 rounded-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        ) : (
          <span className="text-gray-600 font-semibold text-sm">
            {firstLetter}
          </span>
        )}
      </div>
    );
  });

  MeetingAvatar.displayName = 'MeetingAvatar';

  // Inline Meeting Item Component
  const MeetingItem = React.memo(({ meeting, type }: { meeting: Meeting; type: 'pending' | 'upcoming' | 'past' | 'cancelled' }) => {
    const otherUserId = meeting.senderId === userId ? meeting.receiverId : meeting.senderId;
    const otherUserName = getUserDisplayName(otherUserId);
    const isPendingReceiver = type === 'pending' && meeting.receiverId === userId;
    const canCancel = type === 'upcoming' && (meeting.senderId === userId || meeting.state === 'accepted');

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <MeetingAvatar userId={otherUserId} userName={otherUserName} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {type === 'pending' && isPendingReceiver 
                  ? `Meeting Request from ${otherUserName}` 
                  : `Meeting with ${otherUserName}`}
              </h4>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting)}`}>
                {getStatusLabel(meeting)}
              </span>
            </div>
          </div>
        </div>

        {/* Meeting Description */}
        {meeting.description && (
          <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
        )}

        {/* Date and Time */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(meeting.meetingTime)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(meeting.meetingTime)}</span>
          </div>
          {/* Notes indicator for past meetings */}
          {type === 'past' && (
            <>
              {checkingNotes[meeting._id] ? (
                <div className="flex items-center space-x-1 text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span className="text-xs">Checking notes...</span>
                </div>
              ) : meetingNotesStatus[meeting._id] ? (
                <div className="flex items-center space-x-1 text-blue-600">
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-medium">Notes available</span>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Meeting ready indicator for upcoming meetings */}
        {type === 'upcoming' && meeting.state === 'accepted' && meeting.meetingLink && (
          <div className="flex items-center text-blue-600 text-sm font-medium mb-3">
            <Video className="w-4 h-4 mr-2" />
            <span>Meeting ready to join</span>
          </div>
        )}

        {/* Cancellation details for cancelled meetings */}
        {type === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
            <p className="text-sm text-red-600 flex items-center">
              <XCircle className="w-4 h-4 mr-2" />
              Meeting cancelled
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2">
          {/* Pending meeting actions */}
          {isPendingReceiver && (
            <>
              <button
                onClick={() => handleMeetingAction(meeting._id, 'accept')}
                className="px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleMeetingAction(meeting._id, 'reject')}
                className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium transition-colors"
              >
                Decline
              </button>
            </>
          )}

          {/* Join meeting button - only for upcoming meetings */}
          {type === 'upcoming' && meeting.state === 'accepted' && meeting.meetingLink && (
            <button
              onClick={() => handleJoinMeeting(meeting._id)}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center space-x-2 transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Join Meeting</span>
            </button>
          )}

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={() => showCancelMeetingModal(meeting._id)}
              className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Download notes button for past meetings - only show if notes exist */}
          {type === 'past' && meetingNotesStatus[meeting._id] && !checkingNotes[meeting._id] && (
            <button
              onClick={() => downloadMeetingNotes(
                meeting._id, 
                `Meeting with ${otherUserName}`, 
                meeting.meetingTime.toString()
              )}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 text-sm font-medium flex items-center space-x-1 transition-colors"
              title="Download meeting notes"
            >
              <Download className="w-4 h-4" />
              <span>Download Notes</span>
            </button>
          )}
        </div>
      </div>
    );
  });

  MeetingItem.displayName = 'MeetingItem';

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
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
          title="Schedule New Meeting"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Recent Cancellation Alerts - Hidden as requested */}
      {/* Cancellation alerts are now hidden from the top of the interface */}

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {meetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">No meetings scheduled</p>
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto text-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </button>
          </div>
        ) : (
          <>
            {/* Pending Meeting Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                  Pending Requests ({pendingRequests.length})
                </h3>
                <div className="space-y-3">
                  {pendingRequests.map((meeting) => (
                    <MeetingItem 
                      key={meeting._id} 
                      meeting={meeting} 
                      type="pending" 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Upcoming Meetings */}
            {upcomingMeetings.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  Upcoming Meetings ({upcomingMeetings.length})
                </h3>
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <MeetingItem 
                      key={meeting._id} 
                      meeting={meeting} 
                      type="upcoming" 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Active Meetings Message */}
            {!hasActiveMeetingsOrRequests && (
              <div className="text-center py-6">
                <CheckCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No active meetings or pending requests
                </p>
              </div>
            )}

            {/* Past Meetings - Collapsible */}
            {pastMeetings.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                <button
                  onClick={() => setShowPastMeetings(!showPastMeetings)}
                  className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
                >
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    <span>Past Meetings ({pastMeetings.length})</span>
                  </div>
                  {showPastMeetings ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {showPastMeetings && (
                  <div className="p-4 bg-white space-y-3">
                    {pastMeetings.slice().reverse().map((meeting) => (
                      <MeetingItem 
                        key={meeting._id} 
                        meeting={meeting} 
                        type="past" 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cancelled Meetings - Collapsible */}
            {cancelledMeetings.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowCancelledMeetings(!showCancelledMeetings)}
                  className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
                >
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 mr-2 text-red-500" />
                    <span>Cancelled Meetings ({cancelledMeetings.length})</span>
                  </div>
                  {showCancelledMeetings ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {showCancelledMeetings && (
                  <div className="p-4 bg-white space-y-3">
                    {cancelledMeetings.slice().reverse().map((meeting) => (
                      <MeetingItem 
                        key={meeting._id} 
                        meeting={meeting} 
                        type="cancelled" 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
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