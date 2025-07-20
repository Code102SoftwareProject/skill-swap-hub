"use client";

import  { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Calendar, Filter, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import MeetingList from '@/components/meetingSystem/MeetingList';
import SavedNotesList from '@/components/meetingSystem/SavedNotesList';
import NotesViewModal from '@/components/meetingSystem/NotesViewModal';
import CancellationAlert from '@/components/meetingSystem/CancellationAlert';
import Meeting from '@/types/meeting';
import { 
  fetchAllUserMeetings, 
  updateMeeting, 
  filterMeetingsByType, 
  checkMeetingNotesExist,
  cancelMeetingWithReason,
  fetchAllUserMeetingNotes,
  canCancelMeeting,
  fetchUnacknowledgedCancellations,
  acknowledgeMeetingCancellation
} from "@/services/meetingApiServices";
import { fetchUserProfile } from "@/services/chatApiServices";
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import { debouncedApiService } from '@/services/debouncedApiService';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { useAuth } from '@/lib/context/AuthContext';

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

export default function MeetingContent() {
  const { user, token } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<UserProfiles>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<string | null>(null);
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
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');

  // Cancellation alerts states
  const [cancellationAlerts, setCancellationAlerts] = useState<CancellationAlert[]>([]);
  const [loadingCancellations, setLoadingCancellations] = useState(false);
  const [acknowledgingCancellation, setAcknowledgingCancellation] = useState<string | null>(null);

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

  // Fetch all meetings for the authenticated user
  const fetchMeetingsData = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const data = await fetchAllUserMeetings(user._id, token || undefined);
      
      // Additional safety filter to ensure we only show meetings involving the authenticated user
      const userMeetings = data.filter(meeting => 
        meeting.senderId === user._id || meeting.receiverId === user._id
      );
      
      setMeetings(userMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      showAlert('error', 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [user?._id, token]);

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
      if (id === user?._id) continue; // Skip current user
      
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
  }, [user?._id]);

  // Check if notes exist for meetings
  const checkMeetingNotes = useCallback(async (currentMeetings: Meeting[]) => {
    if (!user?._id) return;
    
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
        const hasNotes = await checkMeetingNotesExist(meeting._id, user._id, token || undefined);
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
  }, [user?._id, token]);

  // Fetch saved notes for all meetings
  const fetchSavedNotes = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setLoadingSavedNotes(true);
      const notes = await fetchAllUserMeetingNotes(user._id, undefined, token || undefined);
      setSavedNotes(notes || []);
    } catch (error) {
      console.error('Error fetching saved notes:', error);
      setSavedNotes([]);
    } finally {
      setLoadingSavedNotes(false);
    }
  }, [user?._id, token]);

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

  // Initial data fetch
  useEffect(() => {
    fetchMeetingsData();
    fetchSavedNotes();
  }, [fetchMeetingsData, fetchSavedNotes]);

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

  // Fetch user profiles when meetings change
  useEffect(() => {
    if (meetings.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      fetchUserProfiles(meetings);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [meetings, fetchUserProfiles]);

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
          
          const updatedMeeting = await updateMeeting(meetingId, action, token || undefined);
          
          if (updatedMeeting) {
            setMeetings(prevMeetings => 
              prevMeetings.map(meeting => 
                meeting._id === meetingId ? updatedMeeting : meeting
              )
            );
            showAlert('success', `Meeting ${actionText}ed successfully!`);
          }
          
          // Refresh meetings list after action
          setTimeout(() => {
            fetchMeetingsData();
          }, 100);
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

  // Create Meeting Function - Removed as this component only displays meetings

  // Handle meeting cancellation with reason
  const handleCancelMeeting = async (meetingId: string, reason: string) => {
    if (!user?._id) return;
    
    try {
      const meeting = await cancelMeetingWithReason(meetingId, user._id, reason, token || undefined);

      if (meeting) {
        setMeetings(prevMeetings =>
          prevMeetings.map(m => m._id === meetingId ? meeting : m)
        );

        setShowCancelModal(false);
        setMeetingToCancel(null);
        showAlert('success', 'Meeting cancelled successfully');
        
        // Refresh data
        fetchMeetingsData();
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

  // Fetch cancellation alerts
  const fetchCancellationAlerts = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setLoadingCancellations(true);
      const alerts = await fetchUnacknowledgedCancellations(user._id, token || undefined);
      setCancellationAlerts(alerts);
    } catch (error) {
      console.error('Error fetching cancellation alerts:', error);
    } finally {
      setLoadingCancellations(false);
    }
  }, [user?._id, token]);

  // Acknowledge cancellation alert
  const handleAcknowledgeCancellation = async (cancellationId: string) => {
    if (!user?._id) return;
    
    try {
      setAcknowledgingCancellation(cancellationId);
      const success = await acknowledgeMeetingCancellation(cancellationId, user._id, token || undefined);
      
      if (success) {
        setCancellationAlerts(prev => 
          prev.filter(alert => alert._id !== cancellationId)
        );
        showAlert('success', 'Cancellation acknowledged');
      } else {
        showAlert('error', 'Failed to acknowledge cancellation');
      }
    } catch (error) {
      console.error('Error acknowledging cancellation:', error);
      showAlert('error', 'Failed to acknowledge cancellation');
    } finally {
      setAcknowledgingCancellation(null);
    }
  };

  // Get user display name (needed for search/filter)
  const getUserDisplayName = (userId: string): string => {
    if (userId === user?._id) return 'You';
    
    const profile = userProfiles[userId];
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile?.firstName || 'User';
  };

  // Filter and sort meetings
  const getFilteredAndSortedMeetings = () => {
    let filtered = meetings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(meeting => {
        const otherUserId = meeting.senderId === user?._id ? meeting.receiverId : meeting.senderId;
        const otherUserName = getUserDisplayName(otherUserId).toLowerCase();
        const description = meeting.description.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return otherUserName.includes(searchLower) || description.includes(searchLower);
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(meeting => meeting.state === statusFilter);
    }

    // Sort meetings
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.meetingTime).getTime() - new Date(b.meetingTime).getTime();
          break;
        case 'name':
          const aUserId = a.senderId === user?._id ? a.receiverId : a.senderId;
          const bUserId = b.senderId === user?._id ? b.receiverId : b.senderId;
          const aName = getUserDisplayName(aUserId);
          const bName = getUserDisplayName(bUserId);
          comparison = aName.localeCompare(bName);
          break;
        case 'status':
          comparison = a.state.localeCompare(b.state);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  // Fetch cancellation alerts when component mounts and when meetings change
  useEffect(() => {
    fetchCancellationAlerts();
  }, [fetchCancellationAlerts]);

  // Use API service to filter meetings (same as MeetingBox)
  const allFilteredMeetings = getFilteredAndSortedMeetings();
  const filteredMeetings = filterMeetingsByType(allFilteredMeetings, user?._id || '');
  
  // Extract meeting categories from the filtered result
  const pendingRequests = filteredMeetings.pendingRequests;
  const upcomingMeetings = filteredMeetings.upcomingMeetings;
  const pastMeetings = filteredMeetings.pastMeetings;
  const cancelledMeetings = filteredMeetings.cancelledMeetings;

  // Check if there are any active meetings or requests
  const hasActiveMeetingsOrRequests = pendingRequests.length > 0 || upcomingMeetings.length > 0 || currentlyHappeningMeetings.length > 0;

  if (loading && meetings.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading meetings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Meetings</h1>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </button>
        </div>
      </div>

      {/* Cancellation Alerts */}
      {cancellationAlerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span>⚠️ Meeting Cancellation Alerts</span>
            {loadingCancellations && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
            )}
          </h3>
          <div className="space-y-3">
            {cancellationAlerts.map(alert => (
              <CancellationAlert
                key={alert._id}
                cancellation={alert}
                onAcknowledge={handleAcknowledgeCancellation}
                loading={acknowledgingCancellation === alert._id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto">
        {/* Custom empty state for search/filter results */}
        {(pendingRequests.length === 0 && upcomingMeetings.length === 0 && pastMeetings.length === 0 && cancelledMeetings.length === 0) && (searchTerm || statusFilter !== 'all') ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No meetings found</p>
            <p className="text-gray-400 text-sm mb-6">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (pendingRequests.length === 0 && upcomingMeetings.length === 0 && pastMeetings.length === 0 && cancelledMeetings.length === 0) ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No meetings scheduled</p>
            <p className="text-gray-400 text-sm mb-6">
              Connect with other users and schedule meetings through skill matches in the chat system
            </p>
          </div>
        ) : (
          <MeetingList
            pendingRequests={pendingRequests}
            upcomingMeetings={upcomingMeetings}
            pastMeetings={pastMeetings}
            cancelledMeetings={cancelledMeetings}
            currentlyHappeningMeetings={currentlyHappeningMeetings}
            hasActiveMeetingsOrRequests={hasActiveMeetingsOrRequests}
            showPastMeetings={showPastMeetings}
            showCancelledMeetings={showCancelledMeetings}
            userId={user?._id || ''}
            userProfiles={userProfiles}
            meetingNotesStatus={meetingNotesStatus}
            checkingNotes={checkingNotes}
            actionLoadingStates={actionLoadingStates}
            token={token || undefined}
            onScheduleMeeting={() => {}} // No create meeting in this view - it shows all meetings
            onMeetingAction={handleMeetingAction}
            onCancelMeeting={showCancelMeetingModal}
            onAlert={showAlert}
            onTogglePastMeetings={() => setShowPastMeetings(!showPastMeetings)}
            onToggleCancelledMeetings={() => setShowCancelledMeetings(!showCancelledMeetings)}
            showCreateMeetingButton={false} // Hide create meeting button in dashboard view
          />
        )}
      </div>

      {/* Saved Meeting Notes - Collapsible */}
      <div className="border-t border-gray-200 pt-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowSavedNotes(!showSavedNotes)}
            className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-purple-500" />
              <span>Saved Meeting Notes ({savedNotes.length})</span>
            </div>
            {showSavedNotes ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
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

      {/* Modals */}
      {showCancelModal && meetingToCancel && (
        <CancelMeetingModal
          meetingId={meetingToCancel}
          onClose={() => {
            setShowCancelModal(false);
            setMeetingToCancel(null);
          }}
          onCancel={handleCancelMeeting}
          userName={(() => {
            const meeting = meetings.find(m => m._id === meetingToCancel);
            if (!meeting) return 'User';
            const otherUserId = meeting.senderId === user?._id ? meeting.receiverId : meeting.senderId;
            return userProfiles[otherUserId]?.firstName || 'User';
          })()}
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

      {/* Notes View Modal */}
      {showNotesModal && selectedNote && (
        <NotesViewModal
          note={selectedNote}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedNote(null);
          }}
          onDownload={handleDownloadNotes}
        />
      )}
    </div>
  );
}
