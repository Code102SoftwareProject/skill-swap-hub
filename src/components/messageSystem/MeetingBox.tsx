import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, X, Plus, Check, X as XMark, ExternalLink } from 'lucide-react';
import CreateMeetingModal from '@/components/messageSystem/meetings/CreateMeetingModal';
import { format } from 'date-fns';

interface Meeting {
  _id: string;
  senderId: string;
  receiverId: string;
  description: string;
  sentAt: Date;
  meetingTime: Date;
  meetingLink: string | null;
  acceptStatus: boolean;
  state: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
}

interface MeetingBoxProps {
  chatRoomId: string;
  userId: string;
  onClose: () => void;
}

export default function MeetingBox({ chatRoomId, userId, onClose }: MeetingBoxProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: {firstName: string, lastName: string}}>({});
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
          
          // Fetch other user's profile immediately
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
      setLoading(true); // Add loading state while accepting
      
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
      
      // Handle acceptance of pending meetings
      if (updatedMeeting.state === "pending" && updatedMeeting.acceptStatus) {
        const zoomAccessToken = await generateZoomAccessToken();
        const zoomMeetingLink = await createZoomMeeting(zoomAccessToken);

        updatedMeeting.state = "accepted";
        updatedMeeting.meetingLink = zoomMeetingLink;
        updatedMeeting.acceptStatus = true;
      }
      
      // Update the specific meeting in our state with the returned data
      setMeetings(prevMeetings => 
        prevMeetings.map(meeting => 
          meeting._id === meetingId ? updatedMeeting : meeting
        )
      );
      
      // Force a refresh of all meetings to ensure we have the latest data
      // This is optional but helps ensure everything is in sync
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

  const getUserName = (userId: string) => {
    const profile = userProfiles[userId];
    return profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...';
  };

  const formatDate = (date: Date | string) => {
    const dateObj = new Date(date);
    return format(dateObj, 'MMM d, yyyy');
  };

  const formatTime = (date: Date | string) => {
    const dateObj = new Date(date);
    return format(dateObj, 'h:mm a');
  };

  const getStatusClassName = (meeting: Meeting) => {
    switch (meeting.state) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (meeting: Meeting) => {
    if (meeting.state === 'pending' && meeting.senderId === userId) {
      return 'Awaiting Response';
    }
    return meeting.state.charAt(0).toUpperCase() + meeting.state.slice(1);
  };

  if (loading) {
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
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 border-b pb-1">Meeting Requests</h3>
              <div className="space-y-3">
                {pendingRequests.map(meeting => (
                  <div key={meeting._id} className="border rounded-lg p-4 shadow-sm hover:shadow bg-yellow-50">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">Meeting Request from {getUserName(meeting.senderId)}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClassName(meeting)}`}>
                        {getStatusLabel(meeting)}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(meeting.meetingTime)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatTime(meeting.meetingTime)}</span>
                      </div>
                    </div>
                    
                    {meeting.description && (
                      <p className="mt-2 text-gray-700">{meeting.description}</p>
                    )}
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      <button 
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center"
                        onClick={() => handleAcceptMeeting(meeting._id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </button>
                      <button 
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm flex items-center"
                        onClick={() => handleRejectMeeting(meeting._id)}
                      >
                        <XMark className="w-4 h-4 mr-1" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingMeetings.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 border-b pb-1">Upcoming Meetings</h3>
              <div className="space-y-3">
                {upcomingMeetings.map(meeting => (
                  <div key={meeting._id} className="border rounded-lg p-4 shadow-sm hover:shadow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">
                        Meeting with {getUserName(meeting.senderId === userId ? meeting.receiverId : meeting.senderId)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClassName(meeting)}`}>
                        {getStatusLabel(meeting)}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(meeting.meetingTime)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatTime(meeting.meetingTime)}</span>
                      </div>
                      
                      {meeting.meetingLink && (
                        <div className="flex items-center text-blue-600 font-medium">
                          <svg 
                            className="w-4 h-4 mr-2" 
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M16.2 8.4V7.1c0-.8-.7-1.5-1.5-1.5H5c-.8 0-1.5.7-1.5 1.5v9.1c0 .8.7 1.5 1.5 1.5h9.7c.8 0 1.5-.7 1.5-1.5v-1.3l4.7 2.7c.5.3 1.1-.1 1.1-.7V6.3c0-.6-.6-1-1.1-.7l-4.7 2.8z" />
                          </svg>
                          <span className="truncate">Zoom meeting ready</span>
                        </div>
                      )}
                    </div>
                    
                    {meeting.description && (
                      <p className="mt-2 text-gray-700">{meeting.description}</p>
                    )}
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      {meeting.state === 'accepted' && meeting.meetingLink && (
                        <a 
                          href={meeting.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                                    text-sm flex items-center shadow-sm transition-colors"
                        >
                          <svg 
                            className="w-4 h-4 mr-2" 
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M16.2 8.4V7.1c0-.8-.7-1.5-1.5-1.5H5c-.8 0-1.5.7-1.5 1.5v9.1c0 .8.7 1.5 1.5 1.5h9.7c.8 0 1.5-.7 1.5-1.5v-1.3l4.7 2.7c.5.3 1.1-.1 1.1-.7V6.3c0-.6-.6-1-1.1-.7l-4.7 2.8z" />
                          </svg>
                          Join Zoom Meeting
                        </a>
                      )}
                      
                      {(meeting.senderId === userId || meeting.state === 'accepted') && (
                        <button 
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          onClick={() => handleCancelMeeting(meeting._id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastMeetings.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 border-b pb-1">Past Meetings</h3>
              <div className="space-y-3">
                {pastMeetings.map(meeting => (
                  <div key={meeting._id} className="border rounded-lg p-4 shadow-sm hover:shadow bg-gray-50">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">
                        Meeting with {getUserName(meeting.senderId === userId ? meeting.receiverId : meeting.senderId)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClassName(meeting)}`}>
                        {getStatusLabel(meeting)}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(meeting.meetingTime)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatTime(meeting.meetingTime)}</span>
                      </div>
                    </div>
                    
                    {meeting.description && (
                      <p className="mt-2 text-gray-700">{meeting.description}</p>
                    )}
                    
                    <div className="mt-4 flex justify-end space-x-2">
                      {meeting.state === 'accepted' && meeting.meetingLink && (
                        <a 
                          href={meeting.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                                    text-sm flex items-center shadow-sm transition-colors"
                        >
                          <svg 
                            className="w-4 h-4 mr-2" 
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M16.2 8.4V7.1c0-.8-.7-1.5-1.5-1.5H5c-.8 0-1.5.7-1.5 1.5v9.1c0 .8.7 1.5 1.5 1.5h9.7c.8 0 1.5-.7 1.5-1.5v-1.3l4.7 2.7c.5.3 1.1-.1 1.1-.7V6.3c0-.6-.6-1-1.1-.7l-4.7 2.8z" />
                          </svg>
                          Join Zoom Meeting
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cancelledMeetings.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 border-b pb-1">Cancelled Meetings</h3>
              <div className="space-y-3">
                {cancelledMeetings.map(meeting => (
                  <div key={meeting._id} className="border rounded-lg p-4 shadow-sm hover:shadow bg-gray-50 opacity-75">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">
                        Meeting with {getUserName(meeting.senderId === userId ? meeting.receiverId : meeting.senderId)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClassName(meeting)}`}>
                        {getStatusLabel(meeting)}
                      </span>
                    </div>
                    
                    <div className="mt-2 space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(meeting.meetingTime)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatTime(meeting.meetingTime)}</span>
                      </div>
                    </div>
                    
                    {meeting.description && (
                      <p className="mt-2 text-gray-700">{meeting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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

async function generateZoomAccessToken(): Promise<string> {
  // Implementation for generating Zoom access token
  return 'zoomAccessToken';
}

async function createZoomMeeting(accessToken: string): Promise<string> {
  // Implementation for creating Zoom meeting
  return 'https://zoom.us/j/123456789';
}