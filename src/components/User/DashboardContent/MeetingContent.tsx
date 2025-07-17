"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import MeetingList from '@/components/meetingSystem/MeetingList';
import Meeting from '@/types/meeting';
import { fetchAllUserMeetings, updateMeeting, filterMeetingsByType, checkMeetingNotesExist } from "@/services/meetingApiServices";
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
          async () => checkMeetingNotesExist(meeting._id, user._id),
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

  // Use API service to filter meetings (same as MeetingBox)
  const allFilteredMeetings = getFilteredAndSortedMeetings();
  const filteredMeetings = filterMeetingsByType(allFilteredMeetings, user?._id || '');
  
  // Extract meeting categories from the filtered result
  const pendingRequests = filteredMeetings.pendingRequests;
  const upcomingMeetings = filteredMeetings.upcomingMeetings;
  const pastMeetings = filteredMeetings.pastMeetings;
  const cancelledMeetings = filteredMeetings.cancelledMeetings;

  // Check if there are any active meetings or requests
  const hasActiveMeetingsOrRequests = pendingRequests.length > 0 || upcomingMeetings.length > 0;

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
        ) : (
          <MeetingList
            pendingRequests={pendingRequests}
            upcomingMeetings={upcomingMeetings}
            pastMeetings={pastMeetings}
            cancelledMeetings={cancelledMeetings}
            hasActiveMeetingsOrRequests={hasActiveMeetingsOrRequests}
            showPastMeetings={showPastMeetings}
            showCancelledMeetings={showCancelledMeetings}
            userId={user?._id || ''}
            userProfiles={userProfiles}
            meetingNotesStatus={meetingNotesStatus}
            checkingNotes={checkingNotes}
            onScheduleMeeting={() => {}} // No create meeting in this view - it shows all meetings
            onMeetingAction={handleMeetingAction}
            onCancelMeeting={showCancelMeetingModal}
            onAlert={showAlert}
            onTogglePastMeetings={() => setShowPastMeetings(!showPastMeetings)}
            onToggleCancelledMeetings={() => setShowCancelledMeetings(!showCancelledMeetings)}
          />
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
