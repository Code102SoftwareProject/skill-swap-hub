import React, { useEffect, useState, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { fetchSessions, updateSessionStatus, updateSessionProgress, createSession } from '@/services/sessionApiServices';
import SessionRequests from '@/components/sessionSystem/SessionRequests';
import OngoingSessions from '@/components/sessionSystem/OngoingSessions';
import CompletedSessions from '@/components/sessionSystem/CompletedSessions';
import CancelledSessions from '@/components/sessionSystem/CancelledSessions';
import CreateSessionModal from '@/components/sessionSystem/CreateSessionModal';

interface UserProfile {
  name: string;
  profileImage: string;
}

interface UserProfiles {
  [userId: string]: UserProfile;
}

interface Skill {
  id: string;
  skillTitle: string;
  proficiencyLevel: string;
  description: string;
  categoryName: string;
}

interface SessionBoxProps {
  chatRoomId: string;
  userId: string;
  onClose: () => void;
}

export default function SessionBox({ chatRoomId, userId, onClose }: SessionBoxProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<UserProfiles>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [otherUserSkills, setOtherUserSkills] = useState<Skill[]>([]);

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
            name: `${data.user.firstName} ${data.user.lastName}`,
            profileImage: data.user.profileImage || '/default-avatar.png'
          }
        }));
      }
    } catch (err) {
      console.error(`Error fetching profile for user ${id}:`, err);
    }
  }, [userProfiles]);

  // Fetch user skills
  const fetchUserSkills = useCallback(async (id: string) => {
    try {
      // Use correct endpoint based on whether it's the current user or another user
      const endpoint = id === userId ? '/api/myskills' : `/api/skills/user?userId=${id}`;
      const options = id === userId 
        ? { 
            headers: { 
              'Authorization': `Bearer ${localStorage.getItem('token')}` 
            } 
          } 
        : {};
      
      const res = await fetch(endpoint, options);
      const data = await res.json();
      
      if (data.success || (data.data && Array.isArray(data.data))) {
        const skillsData = data.data || data.skills || [];
        const formattedSkills = skillsData.map((skill: any) => ({
          id: skill.id || skill._id,
          skillTitle: skill.skillTitle,
          proficiencyLevel: skill.proficiencyLevel,
          description: skill.description,
          categoryName: skill.categoryName
        }));
        
        if (id === userId) {
          setUserSkills(formattedSkills);
        } else {
          setOtherUserSkills(formattedSkills);
        }
      }
    } catch (err) {
      console.error(`Error fetching skills for user ${id}:`, err);
    }
  }, [userId]);

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
            fetchUserSkills(otherParticipant);
            fetchUserSkills(userId);
          }
        }
      } catch (error) {
        console.error("Error fetching chat room:", error);
      }
    };
    
    fetchChatRoom();
  }, [chatRoomId, userId, fetchUserProfile, fetchUserSkills]);

  // Fetch sessions
  const fetchSessionsData = useCallback(async () => {
    if (!userId || !otherUserId) return;
    
    try {
      setLoading(true);
      const data = await fetchSessions(userId);
      
      // Filter sessions involving the other user
      const filteredSessions = data.filter(session => 
        (session.user1Id === userId && session.user2Id === otherUserId) || 
        (session.user1Id === otherUserId && session.user2Id === userId)
      );
      
      setSessions(filteredSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, otherUserId]);

  // Fetch sessions when otherUserId is available
  useEffect(() => {
    if (!otherUserId) return;
    fetchSessionsData();
  }, [otherUserId, fetchSessionsData]);

  // Fetch user profiles for all session participants
  useEffect(() => {
    if (sessions.length === 0) return;
    
    const uniqueUserIds = new Set<string>();
    sessions.forEach(session => {
      uniqueUserIds.add(session.user1Id);
      uniqueUserIds.add(session.user2Id);
    });

    uniqueUserIds.forEach(id => fetchUserProfile(id));
  }, [sessions, fetchUserProfile]);

  // Handle session request response (accept/reject)
  const handleSessionRequest = async (sessionId: string, isAccepted: boolean) => {
    try {
      setLoading(true);
      
      const updatedSession = await updateSessionStatus(sessionId, isAccepted);
      
      if (updatedSession) {
        setSessions(prevSessions => 
          prevSessions.map(session => 
            session._id === sessionId ? updatedSession : session
          )
        );
      }
      
      // Refresh sessions after responding
      fetchSessionsData();
    } catch (error) {
      console.error(`Error updating session status:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Handle session progress update
  const handleProgressUpdate = async (progressId: string, updateData: any) => {
    try {
      setLoading(true);
      
      const updatedProgress = await updateSessionProgress(progressId, updateData);
      
      if (updatedProgress) {
        // Refresh sessions to get latest data
        fetchSessionsData();
      }
    } catch (error) {
      console.error('Error updating session progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new session
  const handleCreateSession = async (sessionData: any) => {
    if (!otherUserId) return;
    
    try {
      setLoading(true);
      // Format session data for API
      const newSessionData = {
        user1Id: userId,
        skill1Id: sessionData.mySkillId,
        descriptionOfService1: sessionData.myDescription,
        user2Id: otherUserId,
        skill2Id: sessionData.theirSkillId,
        descriptionOfService2: sessionData.theirDescription,
        startDate: new Date(),
        dueDateUser1: sessionData.dueDateMe,
        dueDateUser2: sessionData.dueDateThem
      };
      
      const newSession = await createSession(newSessionData);
      
      if (newSession) {
        setSessions(prevSessions => [...prevSessions, newSession]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sessions by type
  const sessionRequests = sessions.filter(s => 
    s.isAccepted === null && s.user2Id === userId
  );
  
  const ongoingSessions = sessions.filter(s => 
    (s.isAccepted === true || (s.isAccepted === null && s.user1Id === userId)) && 
    s.status === "active"
  );
  
  const completedSessions = sessions.filter(s => 
    s.status === "completed"
  );
  
  const cancelledSessions = sessions.filter(s => 
    s.status === "canceled" || s.isAccepted === false
  );

  if (loading && sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p>Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Skill Exchange Sessions</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-white p-2 rounded-full hover:bg-blue-700"
            title="Create New Session"
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

      {sessions.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500">No skill exchange sessions yet</p>
          <button 
            className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center mx-auto"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Session
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sessionRequests.length > 0 && (
            <SessionRequests
              sessions={sessionRequests}
              userId={userId}
              userProfiles={userProfiles}
              onAccept={(id) => handleSessionRequest(id, true)}
              onReject={(id) => handleSessionRequest(id, false)}
            />
          )}
          
          {ongoingSessions.length > 0 && (
            <OngoingSessions
              sessions={ongoingSessions}
              userId={userId}
              userProfiles={userProfiles}
              onUpdateProgress={handleProgressUpdate}
            />
          )}
          
          {completedSessions.length > 0 && (
            <CompletedSessions
              sessions={completedSessions}
              userId={userId}
              userProfiles={userProfiles}
            />
          )}
          
          {cancelledSessions.length > 0 && (
            <CancelledSessions
              sessions={cancelledSessions}
              userId={userId}
              userProfiles={userProfiles}
            />
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSession}
          mySkills={userSkills}
          theirSkills={otherUserSkills}
          otherUserName={otherUserId ? userProfiles[otherUserId]?.name || 'User' : 'this user'}
        />
      )}
    </div>
  );
}