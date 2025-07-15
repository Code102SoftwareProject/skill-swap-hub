"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Calendar, Clock, ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle, Download, Video, User, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import Meeting from '@/types/meeting';
import { fetchAllUserMeetings, updateMeeting } from "@/services/meetingApiServices";
import { debouncedApiService } from '@/services/debouncedApiService';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { processAvatarUrl, getFirstLetter } from "@/utils/avatarUtils";
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

export default function MeetingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<UserProfiles>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<string | null>(null);
  const [showPastMeetings, setShowPastMeetings] = useState(false);
  const [showCancelledMeetings, setShowCancelledMeetings] = useState(false);
  const [meetingNotesStatus, setMeetingNotesStatus] = useState<{[meetingId: string]: boolean}>({});
  const [checkingNotes, setCheckingNotes] = useState<{[meetingId: string]: boolean}>({});
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');

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

  // Fetch all meetings for the authenticated user
  const fetchMeetingsData = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const data = await fetchAllUserMeetings(user._id);
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      showAlert('error', 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

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
      const cacheKey = `notes-check-${meeting._id}-${user._id}`;
      
      try {
        const hasNotes = await debouncedApiService.makeRequest(
          cacheKey,
          async () => {
            const response = await fetch(`/api/meeting-notes?meetingId=${meeting._id}&userId=${user._id}`);
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
        setCheckingNotes(prev => ({...prev, [meeting._id]: false}));
      }
    }

    setMeetingNotesStatus(notesStatus);
    setCheckingNotes(checking);
  }, [user?._id]);

  // Initial data fetch
  useEffect(() => {
    fetchMeetingsData();
  }, [fetchMeetingsData]);

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
          
          // Refresh meetings list after action
          setTimeout(() => {
            fetchMeetingsData();
          }, 100);
        } catch (error) {
          console.error(`Error ${action}ing meeting:`, error);
          showAlert('error', `Failed to ${actionText} meeting`);
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
      const response = await fetch('/api/meeting/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          cancelledBy: user._id,
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
      
      // Refresh data
      fetchMeetingsData();
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

  // Download notes for a meeting
  const downloadMeetingNotes = async (meetingId: string, meetingTitle: string, meetingDate: string) => {
    if (!user?._id) return;
    
    try {
      const response = await fetch(`/api/meeting-notes?meetingId=${meetingId}&userId=${user._id}`);
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

        const markdownContent = `# Meeting Notes

**Date:** ${formattedDate}  
**Time:** ${formattedTime}  
**Title:** ${meetingTitle}

---

${data.content}

---

*Downloaded from SkillSwap Hub*`;

        // Create and download the file
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `meeting-notes-${meetingTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${formattedDate.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showAlert('success', 'Meeting notes downloaded successfully');
      } else {
        showAlert('info', 'No notes found for this meeting');
      }
    } catch (error) {
      console.error('Error downloading notes:', error);
      showAlert('error', 'Failed to download notes');
    }
  };

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
    if (userId === user?._id) return 'You';
    
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (meeting: Meeting) => {
    if (meeting.state === 'pending' && meeting.senderId === user?._id) {
      return 'Awaiting Response';
    }
    return meeting.state.charAt(0).toUpperCase() + meeting.state.slice(1);
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

  // Separate meetings into categories
  const filteredMeetings = getFilteredAndSortedMeetings();
  
  const pendingRequests = filteredMeetings.filter(m => 
    m.state === 'pending' && m.receiverId === user?._id && !m.acceptStatus
  );
  
  const upcomingMeetings = filteredMeetings.filter(m => 
    (m.state === 'accepted' || (m.state === 'pending' && m.senderId === user?._id)) && 
    new Date(m.meetingTime) > new Date()
  );

  const pastMeetings = filteredMeetings.filter(m => 
    (m.state === 'completed' || m.state === 'accepted') && 
    new Date(m.meetingTime) <= new Date()
  );

  const cancelledMeetings = filteredMeetings.filter(m => 
    m.state === 'cancelled' || m.state === 'rejected'
  );

  // Check if there are any active meetings or requests
  const hasActiveMeetingsOrRequests = pendingRequests.length > 0 || upcomingMeetings.length > 0;

  // Avatar Component
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
          <Image
            src={avatarUrl}
            alt={userName}
            width={32}
            height={32}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <span className="text-sm font-medium text-gray-600">
            {firstLetter}
          </span>
        )}
      </div>
    );
  });

  MeetingAvatar.displayName = 'MeetingAvatar';

  // Meeting Item Component
  const MeetingItem = React.memo(({ meeting, type }: { meeting: Meeting; type: 'pending' | 'upcoming' | 'past' | 'cancelled' }) => {
    const otherUserId = meeting.senderId === user?._id ? meeting.receiverId : meeting.senderId;
    const otherUserName = getUserDisplayName(otherUserId);
    const isPendingReceiver = type === 'pending' && meeting.receiverId === user?._id;
    const canCancel = type === 'upcoming' && (meeting.senderId === user?._id || meeting.state === 'accepted');

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <MeetingAvatar userId={otherUserId} userName={otherUserName} />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">{otherUserName}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting)}`}>
                  {getStatusLabel(meeting)}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{formatDate(meeting.meetingTime)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{formatTime(meeting.meetingTime)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes indicator for past meetings */}
          {type === 'past' && (
            <>
              {checkingNotes[meeting._id] ? (
                <div className="flex items-center space-x-1 text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-xs">Checking...</span>
                </div>
              ) : meetingNotesStatus[meeting._id] ? (
                <button
                  onClick={() => downloadMeetingNotes(meeting._id, `Meeting with ${otherUserName}`, meeting.meetingTime.toString())}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Download meeting notes"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-medium">Notes available</span>
                </button>
              ) : null}
            </>
          )}
        </div>

        {/* Meeting description */}
        {meeting.description && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
            {meeting.description}
          </p>
        )}

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

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No meetings found' : 'No meetings scheduled'}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'You have no meetings scheduled'}
            </p>
          </div>
        ) : (
          <>
            {/* Pending Meeting Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
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
            {!hasActiveMeetingsOrRequests && (pendingRequests.length > 0 || upcomingMeetings.length > 0) && (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No active meetings or pending requests
                </p>
              </div>
            )}

            {/* Past Meetings - Collapsible */}
            {pastMeetings.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                <button
                  onClick={() => setShowPastMeetings(!showPastMeetings)}
                  className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
                >
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
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
                    <XCircle className="w-5 h-5 mr-2 text-red-500" />
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
    </div>
  );
}
