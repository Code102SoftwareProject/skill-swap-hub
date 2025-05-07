"use client";

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { fetchChatRoom, fetchUserProfile, fetchLastOnline } from "@/services/chatApiServices";

interface ChatHeaderProps {
  chatRoomId: string;
  socket: Socket | null;
  userId: string;
  onToggleMeetings: (show: boolean) => void;
  onToggleSessions: (show: boolean) => void;
  upcomingMeetingsCount?: number;
  initialParticipantInfo?: { id: string, name: string };
  showingMeetings?: boolean;
  showingSessions?: boolean;
}

export default function ChatHeader({ 
  chatRoomId, 
  socket, 
  userId, 
  onToggleMeetings,
  onToggleSessions,
  upcomingMeetingsCount = 0,
  initialParticipantInfo,
  showingMeetings = false,
  showingSessions = false
}: ChatHeaderProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  
  const [otherUserName, setOtherUserName] = useState<string | null>(
    initialParticipantInfo?.name || "Chat Participant"
  );
  const [otherUserId, setOtherUserId] = useState<string | null>(
    initialParticipantInfo?.id || null
  );
  
  const router = useRouter();

  useEffect(() => {
    if (initialParticipantInfo?.id && !otherUserId) {
      setOtherUserId(initialParticipantInfo.id);
    }
  }, [initialParticipantInfo]);

  useEffect(() => {
    let isMounted = true;

    async function fetchChatRoomInfo() {
      try {
        const roomInfo = await fetchChatRoom(chatRoomId);

        if (!isMounted) return;

        if (roomInfo) {
          
          const foundOtherUserId = roomInfo.participants?.find((id: string) => id !== userId);
          if (foundOtherUserId) {
            setOtherUserId(foundOtherUserId);
            fetchOtherUserName(foundOtherUserId);
          }
        }
      } catch (error) {
        console.error('Error fetching chat room info:', error);
      }
    }

    fetchChatRoomInfo();

    return () => {
      isMounted = false;
    };
  }, [chatRoomId, userId]);

  const fetchOtherUserName = async (id: string) => {
    if (!id) return;

    const userData = await fetchUserProfile(id);

    if (userData) {
      setOtherUserName(`${userData.firstName} ${userData.lastName}`);
    } else {
      console.error('Failed to fetch other user name');
      setOtherUserName(null);
    }
  };

  const fetchUserLastOnline = async (id: string) => {
    if (!id) {
      //  Missing user ID
      console.log('No other user ID provided to fetchLastOnline');
      return;
    }

    // * Debugging: Log fetch attempt
    console.log('Fetching last online for user ID:', id);

    // * API call to retrieve last online timestamp
    const lastOnlineData = await fetchLastOnline(id);

    if (lastOnlineData) {
      try {
        // * Parse the ISO string into a Date object
        const parsedDate = parseISO(lastOnlineData);
        // ? Consider removing this log in production
        console.log('Parsed Date object:', parsedDate);

        // ! Validate date is actually valid before setting state
        if (!isNaN(parsedDate.getTime())) {
          setLastOnline(parsedDate);
        } else {
          // * Reset state if date is invalid
          setLastOnline(null);
        }
      } catch (parseError) {
        // ! Error handling: Failed to parse date string
        console.error('Error parsing date with parseISO:', parseError);
        setLastOnline(null);
      }
    } else {
      // * No last online data available, reset state
      setLastOnline(null);
    }
  };

  useEffect(() => {
    if (otherUserId) {
      if (!isOnline) {
        fetchUserLastOnline(otherUserId);
      }
      if (socket) {
        socket.emit("get_online_users");
      }
    }
  }, [otherUserId, socket]);

  useEffect(() => {
    if (!socket || !otherUserId) return;

    socket.emit("get_online_users");

    const handleOnlineUsers = (users: string[]) => {
      const isOtherUserOnline = users.includes(otherUserId);
      setIsOnline(isOtherUserOnline);
      if (!isOtherUserOnline) {
        fetchUserLastOnline(otherUserId);
      } else {
        setLastOnline(null);
      }
    };

    /**
     * * Handler for when another user comes online
     * Updates the UI to show online status and clears any last seen timestamp
     * 
     * @param {Object} data - Socket event data
     * @param {string} data.userId - ID of the user who came online
     */
    const handleUserOnline = (data: { userId: string }) => {
      // ! Only update if it's the user we're chatting with
      if (data.userId === otherUserId) {
        setIsOnline(true);
        // * Clear last online timestamp when user comes online
        setLastOnline(null);
      }
    };

    /**
     * * Handler for when another user goes offline
     * Updates the UI to show offline status and fetches their last online timestamp
     * 
     * @param {Object} data - Socket event data
     * @param {string} data.userId - ID of the user who went offline
     */
    const handleUserOffline = async (data: { userId: string }) => {
      // ! Only update if it's the user we're chatting with
      if (data.userId === otherUserId) {
        setIsOnline(false);
        // * Fetch and display when they were last seen
        // ? Consider adding error handling for the API call
        await fetchUserLastOnline(otherUserId);
      }
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [socket, userId, otherUserId]);

  useEffect(() => {
    if (!socket || !otherUserId) return;

    // Reset all status indicators when changing chats
    setIsTyping(false);
    setIsOnline(false);
    setLastOnline(null);
  }, [chatRoomId]);

  useEffect(() => {
    if (!socket || !otherUserId) return;

    // Force re-check online status when chat changes
    socket.emit("get_online_users");

    const handleUserTyping = (data: { userId: string, chatRoomId: string }) => {
      // Only show typing indicator if it's for the current chat room
      if (data.userId === otherUserId && data.chatRoomId === chatRoomId) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string, chatRoomId: string }) => {
      // Only process typing events for the current chat room
      if (data.userId === otherUserId && data.chatRoomId === chatRoomId) {
        setIsTyping(false);
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket, otherUserId, chatRoomId]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleToggleMeetings = () => {
    onToggleMeetings(!showingMeetings);
  };

  const handleToggleSessions = () => {
    onToggleSessions(!showingSessions);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-primary border-b">
      <div>
        <h1 className="text-lg font-semibold text-white">
          {otherUserName || `Chat ${chatRoomId.substring(0, 8)}`}
        </h1>
        <p className="text-sm text-blue-100">
          {isTyping ? 'Typing...' : (
            isOnline ? 'Online' : (
              lastOnline instanceof Date && !isNaN(lastOnline.getTime())
                ? `Last seen ${formatDistanceToNow(lastOnline, { addSuffix: true })}`
                : 'Offline'
            )
          )}
        </p>
      </div>
      <div className="flex space-x-4">
        {/*Back to Dashboard Button*/}
        <button
          onClick={handleBackToDashboard}
          className="flex flex-col items-center text-white hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mb-1" />
          <span className="text-xs">Dashboard</span>
        </button>

        {/*Session Button*/}
        <button 
          className={`flex flex-col items-center text-white ${showingSessions ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleSessions}
        >
          <BookOpen className="h-5 w-5 mb-1" />
          <span className="text-xs">Sessions</span>
        </button>
        {/*Meeting Button*/}
        <button 
          className={`flex flex-col items-center text-white ${showingMeetings ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleMeetings}
        >
          <Calendar className="h-5 w-5 mb-1" />
          <div className="flex items-center">
            <span className="text-xs">Meetings</span>
            {/*Number of Meeting Indicator*/}
            {upcomingMeetingsCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4">
                {upcomingMeetingsCount}
              </span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
}