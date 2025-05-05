import React, { useState, useEffect } from 'react';
import { X, Plus, Loader } from 'lucide-react';
import SessionRequests from '@/components/sessionSystem/SessionRequests';
import OngoingSessions from '@/components/sessionSystem/OngoingSessions';
import CompletedSessions from '@/components/sessionSystem/CompletedSessions';
import CancelledSessions from '@/components/sessionSystem/CancelledSessions';
import CreateSessionModal from '@/components/sessionSystem/CreateSessionModal';
import { createSession, getUserSessions, updateSessionStatus, updateSessionProgress } from '@/services/sessionApiServices';
import { getUserSkills } from '@/services/skillApiServices';
import { getOtherUserFromChatRoom } from '@/services/chatUtilServices';

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
  const [userProfiles, setUserProfiles] = useState<UserProfiles>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>("User");
  const [userSkills, setUserSkills] = useState<Skill[]>([]);
  const [otherUserSkills, setOtherUserSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the other user info from the chat room
  useEffect(() => {
    async function getOtherUser() {
      if (!chatRoomId || !userId) return;

      try {
        const otherUser = await getOtherUserFromChatRoom(chatRoomId, userId);

        if (otherUser) {
          setOtherUserId(otherUser.id);
          setOtherUserName(otherUser.name);

          // Update userProfiles state with this info
          setUserProfiles(prev => ({
            ...prev,
            [otherUser.id]: {
              name: otherUser.name,
              profileImage: otherUser.avatar || '/default-avatar.png'
            }
          }));
        } else {
          setError('Could not identify the other user');
        }
      } catch (err) {
        console.error('Error getting other user:', err);
        setError('Failed to get chat participant information');
      }
    }

    getOtherUser();
  }, [chatRoomId, userId]);

  // Fetch sessions on component mount
  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const sessionsData = await getUserSessions(userId);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the create modal
  const handleOpenCreateModal = async () => {
    if (!otherUserId) {
      setError('Cannot identify the other user');
      return;
    }

    try {
      setLoadingSkills(true);
      setError(null);
      console.log("Fetching skills for users:", userId, otherUserId);

      // Fetch both users' skills in parallel
      const [mySkillsData, otherSkillsData] = await Promise.all([
        getUserSkills(userId),
        getUserSkills(otherUserId)
      ]);

      console.log("My skills count:", mySkillsData.length);
      console.log("Other user skills count:", otherSkillsData.length);

      setUserSkills(mySkillsData);
      setOtherUserSkills(otherSkillsData);
      setShowCreateModal(true);
    } catch (err: any) {
      console.error("Error loading skills:", err);
      setError(`Failed to load skills: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingSkills(false);
    }
  };

  // Handle creating a session
  const handleCreateSession = async (sessionData: any) => {
    try {
      setLoading(true);
      await createSession(sessionData);
      await fetchSessions();
      setShowCreateModal(false);
    } catch (err: any) {
      setError(`Failed to create session: ${err.message || 'Unknown error'}`);
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

  const handleSessionRequest = async (sessionId: string, isAccepted: boolean) => {
    try {
      setLoading(true);
      await updateSessionStatus(sessionId, isAccepted);
      // Refresh sessions after update
      fetchSessions();
    } catch (err) {
      setError(`Failed to ${isAccepted ? 'accept' : 'reject'} session`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (progressId: string, updateData: any) => {
    try {
      setLoading(true);
      await updateSessionProgress(progressId, updateData);
      // Refresh sessions after update
      fetchSessions();
    } catch (err) {
      setError('Failed to update progress');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Skill Exchange Sessions</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenCreateModal}
            className="bg-primary text-white p-2 rounded-full hover:bg-blue-700"
            title="Create New Session"
            disabled={loadingSkills}
          >
            {loadingSkills ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center p-8">
          <Loader className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-gray-500">Loading sessions...</p>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500">No skill exchange sessions yet</p>
          <button
            className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center mx-auto"
            onClick={handleOpenCreateModal}
            disabled={loadingSkills}
          >
            {loadingSkills ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
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
          otherUserName={otherUserName}
          userId={userId}
          otherUserId={otherUserId || ''}
        />
      )}
    </div>
  );
}