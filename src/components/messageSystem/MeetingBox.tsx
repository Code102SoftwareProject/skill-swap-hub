import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Plus, AlertCircle, Clock, ChevronDown, ChevronRight, Calendar, CheckCircle, XCircle } from 'lucide-react';
import CreateMeetingModal from '@/components/meetingSystem/CreateMeetingModal';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import PendingMeetingList from '@/components/meetingSystem/PendingMeetingList';
import UpcomingMeetingList from '@/components/meetingSystem/UpcomingMeetingList';
import Meeting from '@/types/meeting';
import { fetchMeetings, createMeeting, updateMeeting } from "@/services/meetingApiServices";
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import { debouncedApiService } from '@/services/debouncedApiService';
import Alert from '@/components/ui/Alert';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';

interface UserProfile {
  firstName: string;
  lastName: string;
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
  const [cancellationAlerts, setCancellationAlerts] = useState<CancellationAlert[]>([]);
  const [showPastMeetings, setShowPastMeetings] = useState(false);
  const [showCancelledMeetings, setShowCancelledMeetings] = useState(false);

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
        if (onMeetingUpdate && !hasFetchedMeetings.current) {
          hasFetchedMeetings.current = true;
          onMeetingUpdate();
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    hasFetchedMeetings.current = false; // Reset for new otherUserId
    loadMeetings();
  }, [otherUserId, userId]); // Remove onMeetingUpdate dependency

  // Fetch meetings data
  const fetchMeetingsData = useCallback(async (otherUserID: string) => {
    try {
      setLoading(true);
      const data = await fetchMeetings(userId, otherUserID);
      setMeetings(data);

      // Notify parent component about meeting updates
      if (onMeetingUpdate) {
        onMeetingUpdate();
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, onMeetingUpdate]); // Remove fetchRecentCancellations dependency

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
            if (prev[id] && prev[id].firstName === profileData.firstName && prev[id].lastName === profileData.lastName) {
              return prev; // No change needed
            }
            
            return {
              ...prev,
              [id]: {
                firstName: profileData.firstName,
                lastName: profileData.lastName
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
  }, [meetings.length, fetchUserProfiles]); // Stable dependencies only

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
  }, [meetings.length, fetchRecentCancellations]); // Stable dependencies only

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
          
          // Refresh meetings after accepting
          if (action === 'accept' && otherUserId) {
            fetchMeetingsData(otherUserId);
          }
          
          // Invalidate cache for both users
          if (otherUserId) {
            invalidateUsersCaches(userId, otherUserId);
          }
          
          // Notify parent component about meeting updates
          if (onMeetingUpdate) {
            onMeetingUpdate();
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
        if (onMeetingUpdate) {
          onMeetingUpdate();
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
      if (onMeetingUpdate) {
        onMeetingUpdate();
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

  // Simple meeting item component for past/cancelled meetings
  const MeetingItem = ({ meeting, type }: { meeting: Meeting; type: 'past' | 'cancelled' }) => {
    const otherUser = meeting.senderId === userId 
      ? userProfiles[meeting.receiverId] 
      : userProfiles[meeting.senderId];
    
    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Get cancellation info for cancelled meetings from alerts
    const cancellationInfo = type === 'cancelled' 
      ? cancellationAlerts.find(alert => alert.meetingId === meeting._id)
      : null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-medium text-gray-900">
                Meeting with {otherUser?.firstName || 'User'}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                type === 'cancelled' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {type === 'cancelled' ? 'Cancelled' : 'Completed'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {meeting.description}
            </p>
            
            {type === 'cancelled' && cancellationInfo && (
              <p className="text-xs text-red-600 mb-2 flex items-center">
                <XCircle className="w-3 h-3 mr-1" />
                Cancelled by {cancellationInfo.cancellerName}: {cancellationInfo.reason}
              </p>
            )}
            
            <p className="text-xs text-gray-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDate(meeting.meetingTime)}
            </p>
          </div>
        </div>
      </div>
    );
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Meetings</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          title="Schedule New Meeting"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Meeting</span>
        </button>
      </div>

      {/* Recent Cancellation Alerts */}
      {cancellationAlerts.length > 0 && (
        <div className="mb-4 space-y-3">
          {cancellationAlerts.map((alert) => {
            // Note: cancellerName will be resolved when we fetch the cancellation data with user ID
            const displayName = alert.cancellerName || 'Someone';
            
            return (
              <div
                key={alert.meetingId}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-amber-900 font-medium">
                      Meeting cancelled by {displayName}
                    </p>
                    <p className="text-amber-800 text-sm mt-1">
                      Reason: {alert.reason}
                    </p>
                    <p className="text-amber-700 text-xs mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(alert.cancelledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDismissCancellation(alert.meetingId)}
                  className="text-amber-600 hover:text-amber-800 p-1 rounded transition-colors"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No meetings scheduled</p>
            <p className="text-gray-400 text-sm mb-6">Start collaborating by scheduling your first meeting</p>
            <button 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
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
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Pending Requests ({pendingRequests.length})
                </h3>
                <PendingMeetingList
                  meetings={pendingRequests}
                  userId={userId}
                  userProfiles={userProfiles}
                  onAccept={(id) => handleMeetingAction(id, 'accept')}
                  onReject={(id) => handleMeetingAction(id, 'reject')}
                />
              </div>
            )}
            
            {/* Upcoming Meetings */}
            {upcomingMeetings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Upcoming Meetings ({upcomingMeetings.length})
                </h3>
                <UpcomingMeetingList
                  meetings={upcomingMeetings}
                  userId={userId}
                  userProfiles={userProfiles}
                  onCancel={showCancelMeetingModal}
                />
              </div>
            )}

            {/* No Active Meetings Message */}
            {!hasActiveMeetingsOrRequests && (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No active meetings or pending requests
                </p>
              </div>
            )}

            {/* Past Meetings - Collapsible */}
            {pastMeetings.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowPastMeetings(!showPastMeetings)}
                  className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
                >
                  <span>Past Meetings ({pastMeetings.length})</span>
                  {showPastMeetings ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {showPastMeetings && (
                  <div className="p-4 bg-white space-y-3">
                    {pastMeetings.map((meeting) => (
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
                  <span>Cancelled Meetings ({cancelledMeetings.length})</span>
                  {showCancelledMeetings ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {showCancelledMeetings && (
                  <div className="p-4 bg-white space-y-3">
                    {cancelledMeetings.map((meeting) => (
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