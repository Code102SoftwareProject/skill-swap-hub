import React, { useEffect, useState, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import CreateMeetingModal from '@/components/meetingSystem/CreateMeetingModal';
import CancelMeetingModal from '@/components/meetingSystem/CancelMeetingModal';
import CancellationAlert from '@/components/meetingSystem/CancellationAlert';
import PendingMeetingList from '@/components/meetingSystem/PendingMeetingList';
import UpcomingMeetingList from '@/components/meetingSystem/UpcomingMeetingList';
import MeetingLists from '@/components/meetingSystem/MeetingLists';
import Meeting from '@/types/meeting';
import { fetchMeetings, createMeeting, updateMeeting } from "@/services/meetingApiServices";

interface UserProfile {
  firstName: string;
  lastName: string;
}

interface UserProfiles {
  [userId: string]: UserProfile;
}

interface CancellationInfo {
  [meetingId: string]: {
    _id: string;
    reason: string;
    cancelledAt: string;
    acknowledged: boolean;
    acknowledgedAt: string | null;
    cancelledBy: string;
  };
}

interface MeetingBoxProps {
  chatRoomId: string;
  userId: string;
  onClose: () => void;
}

export default function MeetingBox({ chatRoomId, userId, onClose }: MeetingBoxProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<UserProfiles>({});
  const [cancellationInfo, setCancellationInfo] = useState<CancellationInfo>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [dismissedCancellations, setDismissedCancellations] = useState<Set<string>>(new Set());

  // ! Filter meetings by type - Move this to the top before using them
  const pendingRequests = meetings.filter(m => 
    m.state === 'pending' && m.receiverId === userId && !m.acceptStatus
  );
  
  const upcomingMeetings = meetings.filter(m => 
    (m.state === 'accepted' || (m.state === 'pending' && m.senderId === userId)) && 
    new Date(m.meetingTime) > new Date()
  );
  
  const pastMeetings = meetings.filter(m => 
    (m.state === 'completed' || m.state === 'accepted') && 
    new Date(m.meetingTime) <= new Date()
  );
  
  const cancelledMeetings = meetings.filter(m => 
    m.state === 'cancelled' || m.state === 'rejected'
  );

  // Fetch user profile by ID
  const fetchUserProfile = useCallback(async (id: string) => {
    if (userProfiles[id]) return;
    
    try {
      const res = await fetch(`/api/users/profile?id=${id}`);
      const data = await res.json();
      
      if (data.success) {
        setUserProfiles(prev => ({
          ...prev,
          [id]: {
            firstName: data.user.firstName,
            lastName: data.user.lastName
          }
        }));
      }
    } catch (err) {
      console.error(`Error fetching profile for user ${id}:`, err);
    }
  }, [userProfiles]);

  // ! Fetch chat room to get other user ID
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
          setOtherUserId(otherParticipant);
          
          if (otherParticipant) {
            fetchUserProfile(otherParticipant);
          }
        }
      } catch (error) {
        console.error("Error fetching chat room:", error);
      }
    };
    
    fetchChatRoom();
  }, [chatRoomId, userId, fetchUserProfile]);

  // Fetch cancellation details for cancelled meetings
  const fetchCancellationDetails = useCallback(async (meetingIds: string[]) => {
    try {
      const cancellationPromises = meetingIds.map(async (meetingId) => {
        const response = await fetch(`/api/meeting/cancellation?meetingId=${meetingId}`);
        if (response.ok) {
          const data = await response.json();
          return { meetingId, data };
        }
        return null;
      });

      const results = await Promise.all(cancellationPromises);
      const newCancellationInfo: CancellationInfo = {};

      results.forEach((result) => {
        if (result?.data) {
          newCancellationInfo[result.meetingId] = result.data;
        }
      });

      setCancellationInfo(prev => ({ ...prev, ...newCancellationInfo }));
    } catch (error) {
      console.error('Error fetching cancellation details:', error);
    }
  }, []);

  // ! Fetch meetings
  const fetchMeetingsData = useCallback(async (otherUserID: string) => {
    try {
      setLoading(true);
      const data = await fetchMeetings(userId, otherUserID);
      setMeetings(data);

      // Fetch cancellation details for cancelled meetings
      const cancelledMeetingIds = data
        .filter(m => m.state === 'cancelled')
        .map(m => m._id);
      
      if (cancelledMeetingIds.length > 0) {
        fetchCancellationDetails(cancelledMeetingIds);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchCancellationDetails]);

  // ! Fetch meetings when otherUserId is available
  useEffect(() => {
    if (!otherUserId) return;
    fetchMeetingsData(otherUserId);
  }, [otherUserId, fetchMeetingsData]);

  // Fetch user profiles for all meeting participants
  useEffect(() => {
    if (meetings.length === 0) return;
    
    const uniqueUserIds = new Set<string>();
    meetings.forEach(meeting => {
      uniqueUserIds.add(meeting.senderId);
      uniqueUserIds.add(meeting.receiverId);
    });

    uniqueUserIds.forEach(id => fetchUserProfile(id));
  }, [meetings, fetchUserProfile]);

  // meeting action handler
  const handleMeetingAction = async (meetingId: string, action: 'accept' | 'reject' | 'cancel') => {
    try {
      setLoading(true);
      
      const updatedMeeting = await updateMeeting(meetingId, action);
      
      if (updatedMeeting) {
        setMeetings(prevMeetings => 
          prevMeetings.map(meeting => 
            meeting._id === meetingId ? updatedMeeting : meeting
          )
        );
      }
      
      // Refresh meetings after accepting
      if (action === 'accept' && otherUserId) {
        fetchMeetingsData(otherUserId);
      }
    } catch (error) {
      console.error(`Error ${action}ing meeting:`, error);
    } finally {
      setLoading(false);
    }
  };

  // * Create Meeting Function
  const handleCreateMeeting = async (meetingData: any) => {
    if (!otherUserId) return;
    
    try {
      setLoading(true);
      const newMeeting = await createMeeting({
        senderId: userId,
        receiverId: otherUserId,
        description: meetingData.description,
        meetingTime: new Date(meetingData.date + 'T' + meetingData.time)
      });
      
      if (newMeeting) {
        setMeetings(prevMeetings => [...prevMeetings, newMeeting]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle meeting cancellation with reason
  const handleCancelMeeting = async (meetingId: string, reason: string) => {
    try {
      setLoading(true);

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

      const { meeting, cancellation } = await response.json();

      // Update meetings state
      setMeetings(prevMeetings =>
        prevMeetings.map(m => m._id === meetingId ? meeting : m)
      );

      // Update cancellation info
      setCancellationInfo(prev => ({
        ...prev,
        [meetingId]: cancellation
      }));

      setShowCancelModal(false);
      setMeetingToCancel(null);
    } catch (error) {
      console.error('Error cancelling meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle acknowledgment of cancellation
  const handleAcknowledgeCancellation = async (cancellationId: string) => {
    try {
      const response = await fetch('/api/meeting/cancellation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellationId,
          acknowledgedBy: userId
        }),
      });

      if (!response.ok) {
        throw new Error(`Error acknowledging cancellation: ${response.status}`);
      }

      const updatedCancellation = await response.json();

      // Update cancellation info
      setCancellationInfo(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(meetingId => {
          if (updated[meetingId]._id === cancellationId) {
            updated[meetingId] = updatedCancellation;
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Error acknowledging cancellation:', error);
    }
  };

  // Show cancel modal
  const showCancelMeetingModal = (meetingId: string) => {
    setMeetingToCancel(meetingId);
    setShowCancelModal(true);
  };

  // Get recent cancellations for alert display (last 7 days, not dismissed)
  const getRecentCancellations = useCallback(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return cancelledMeetings
      .filter(meeting => {
        const cancellation = cancellationInfo[meeting._id];
        if (!cancellation) return false;
        
        const cancelledDate = new Date(cancellation.cancelledAt);
        const isRecent = cancelledDate > sevenDaysAgo;
        const notDismissed = !dismissedCancellations.has(meeting._id);
        
        return isRecent && notDismissed;
      })
      .map(meeting => {
        const cancellation = cancellationInfo[meeting._id];
        const cancellerName = userProfiles[cancellation.cancelledBy]?.firstName || 'Someone';
        
        return {
          meetingId: meeting._id,
          reason: cancellation.reason,
          cancelledAt: cancellation.cancelledAt,
          cancelledBy: cancellation.cancelledBy,
          cancellerName,
          meetingTime: meeting.meetingTime.toString(),
          acknowledged: cancellation.acknowledged
        };
      });
  }, [cancelledMeetings, cancellationInfo, dismissedCancellations, userProfiles]);

  // Handle dismissing cancellation alert
  const handleDismissCancellation = (meetingId: string) => {
    setDismissedCancellations(prev => new Set([...prev, meetingId]));
  };

  // Handle acknowledging cancellation from alert
  const handleAcknowledgeCancellationFromAlert = async (meetingId: string) => {
    const cancellation = cancellationInfo[meetingId];
    if (cancellation) {
      await handleAcknowledgeCancellation(cancellation._id);
      handleDismissCancellation(meetingId);
    }
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-2 md:p-4">
        <p className="text-sm md:text-base">Loading meetings...</p>
      </div>
    );
  }

  const recentCancellations = getRecentCancellations();

  return (
    <div className="flex-1 overflow-auto bg-white p-2 md:p-4 relative">
      {/* Heading*/}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold text-primary font-heading truncate">Meetings</h2>
        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white p-2 rounded-full hover:bg-blue-700"
            title="Schedule New Meeting"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 p-2"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Cancellation Alerts */}
      <CancellationAlert
        cancellations={recentCancellations}
        currentUserId={userId}
        onDismiss={handleDismissCancellation}
        onAcknowledge={handleAcknowledgeCancellationFromAlert}
      />

      {meetings.length === 0 ? (
        <div className="text-center p-4 md:p-8">
          <p className="text-gray-500 font-body text-sm md:text-base">No meetings scheduled yet</p>
          <button 
            className="mt-4 bg-primary text-white px-3 py-2 md:px-4 md:py-2 rounded hover:bg-blue-700 flex items-center mx-auto text-sm md:text-base"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Schedule New Meeting</span>
            <span className="sm:hidden">New Meeting</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <PendingMeetingList
            meetings={pendingRequests}
            userId={userId}
            userProfiles={userProfiles}
            onAccept={(id) => handleMeetingAction(id, 'accept')}
            onReject={(id) => handleMeetingAction(id, 'reject')}
          />
          
          <UpcomingMeetingList
            meetings={upcomingMeetings}
            userId={userId}
            userProfiles={userProfiles}
            onCancel={showCancelMeetingModal}
          />
          
          <MeetingLists
            type="past"
            meetings={pastMeetings}
            userId={userId}
            userProfiles={userProfiles}
          />
          
          <MeetingLists
            type="cancelled"
            meetings={cancelledMeetings}
            userId={userId}
            userProfiles={userProfiles}
            cancellationInfo={cancellationInfo}
            onAcknowledgeCancellation={handleAcknowledgeCancellation}
          />
        </div>
      )}

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
    </div>
  );
}