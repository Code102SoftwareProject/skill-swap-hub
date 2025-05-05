import React, { useEffect, useState, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import CreateMeetingModal from '@/components/meetingSystem/CreateMeetingModal';
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
interface MeetingBoxProps {
  chatRoomId: string;
  userId: string;
  onClose: () => void;
}

export default function MeetingBox({ chatRoomId, userId, onClose }: MeetingBoxProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<UserProfiles>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

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

  // Fetch meetings
  const fetchMeetingsData = useCallback(async (otherUserID: string) => {
    try {
      setLoading(true);
      const data = await fetchMeetings(userId, otherUserID);
      setMeetings(data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch meetings when otherUserId is available
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

  // Generic meeting action handler (accept, reject, cancel)
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

  // Filter meetings by type
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

  if (loading && meetings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p>Loading meetings...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Meetings</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white p-2 rounded-full hover:bg-blue-700"
            title="Schedule New Meeting"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500">No meetings scheduled yet</p>
          <button 
            className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center mx-auto"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule New Meeting
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
            onCancel={(id) => handleMeetingAction(id, 'cancel')}
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
    </div>
  );
}

