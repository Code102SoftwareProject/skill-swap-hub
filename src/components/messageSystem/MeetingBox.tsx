import React, { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import CreateMeetingModal from '@/components/messageSystem/meetings/CreateMeetingModal';
import PendingMeetingList from '@/components/messageSystem/meetings/PendingMeetingList';
import UpcomingMeetingList from '@/components/messageSystem/meetings/UpcomingMeetingList';
import MeetingLists from '@/components/messageSystem/meetings/MeetingLists';
import { Meeting, UserProfiles } from '@/components/messageSystem/meetings/types';

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
          
          if (otherParticipant && !userProfiles[otherParticipant]) {
            try {
              const res = await fetch(`/api/users/profile?id=${otherParticipant}`);
              const userData = await res.json();
              
              if (userData.success) {
                setUserProfiles(prev => ({
                  ...prev,
                  [otherParticipant]: {
                    firstName: userData.user.firstName,
                    lastName: userData.user.lastName
                  }
                }));
              }
            } catch (err) {
              console.error(`Error fetching profile for user ${otherParticipant}:`, err);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chat room:", error);
      }
    };
    
    fetchChatRoom();
  }, [chatRoomId, userId, userProfiles]);

  const fetchMeetings = async (otherUserID: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meeting`);
      const data = await response.json();
      
      const relevantMeetings = data.filter((meeting: Meeting) => 
        (meeting.senderId === userId && meeting.receiverId === otherUserID) || 
        (meeting.senderId === otherUserID && meeting.receiverId === userId)
      );
      
      console.log("Fetched meetings:", relevantMeetings);
      setMeetings(relevantMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!otherUserId) return;
    fetchMeetings(otherUserId);
  }, [userId, otherUserId, chatRoomId]);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      const uniqueUserIds = new Set<string>();
      
      meetings.forEach(meeting => {
        uniqueUserIds.add(meeting.senderId);
        uniqueUserIds.add(meeting.receiverId);
      });

      for (const id of uniqueUserIds) {
        if (!userProfiles[id]) {
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
        }
      }
    };

    if (meetings.length > 0) {
      fetchUserProfiles();
    }
  }, [meetings, userProfiles]);

  const handleAcceptMeeting = async (meetingId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/meeting', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: meetingId,
          acceptStatus: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const updatedMeeting = await response.json();
      console.log("Meeting accepted, received updated meeting:", updatedMeeting);
      
      setMeetings(prevMeetings => 
        prevMeetings.map(meeting => 
          meeting._id === meetingId ? updatedMeeting : meeting
        )
      );
      
      if (otherUserId) {
        fetchMeetings(otherUserId);
      }
    } catch (error) {
      console.error('Error accepting meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMeeting = async (meetingId: string) => {
    try {
      const response = await fetch('/api/meeting', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: meetingId,
          state: 'rejected'
        }),
      });
      
      const updatedMeeting = await response.json();
      
      setMeetings(prevMeetings => 
        prevMeetings.map(meeting => 
          meeting._id === meetingId ? updatedMeeting : meeting
        )
      );
    } catch (error) {
      console.error('Error rejecting meeting:', error);
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    try {
      const response = await fetch('/api/meeting', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: meetingId,
          state: 'cancelled'
        }),
      });
      
      const updatedMeeting = await response.json();
      
      setMeetings(prevMeetings => 
        prevMeetings.map(meeting => 
          meeting._id === meetingId ? updatedMeeting : meeting
        )
      );
    } catch (error) {
      console.error('Error cancelling meeting:', error);
    }
  };

  const handleCreateMeeting = async (meetingData: any) => {
    if (!otherUserId) return;
    
    try {
      const response = await fetch('/api/meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: userId,
          receiverId: otherUserId,
          description: meetingData.description,
          meetingTime: new Date(meetingData.date + 'T' + meetingData.time)
        }),
      });
      
      const newMeeting = await response.json();
      
      setMeetings(prevMeetings => [...prevMeetings, newMeeting]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p>Loading meetings...</p>
      </div>
    );
  }

  function getUserName(userId: string): string {
    if (userProfiles[userId]) {
      return `${userProfiles[userId].firstName} ${userProfiles[userId].lastName}`;
    }
    return 'User';
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
            onAccept={handleAcceptMeeting}
            onReject={handleRejectMeeting}
          />
          
          <UpcomingMeetingList
            meetings={upcomingMeetings}
            userId={userId}
            userProfiles={userProfiles}
            onCancel={handleCancelMeeting}
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
          receiverName={otherUserId ? getUserName(otherUserId) : 'this user'}
        />
      )}
    </div>
  );
}

