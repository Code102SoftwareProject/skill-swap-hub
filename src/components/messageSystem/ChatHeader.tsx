"use client";

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/lib/context/SocketContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { fetchChatRoom, fetchUserProfile, fetchLastOnline } from "@/services/chatApiServices";

interface ChatHeaderProps {
  chatRoomId: string;
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
  userId, 
  onToggleMeetings,
  onToggleSessions,
  upcomingMeetingsCount = 0,
  initialParticipantInfo,
  showingMeetings = false,
  showingSessions = false
}: ChatHeaderProps) {
  const { socket } = useSocket();
  
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

  // Add a useRef to track if we've already fetched last online status
  const lastOnlineFetchedRef = useRef<boolean>(false);
  
  const fetchUserLastOnline = async (id: string) => {
    if (!id) {
      console.log('No other user ID provided to fetchLastOnline');
      return;
    }
    
    // Prevent repeated fetches for the same user
    if (lastOnlineFetchedRef.current) return;
    
    lastOnlineFetchedRef.current = true;
    
    const lastOnlineData = await fetchLastOnline(id);

    if (lastOnlineData) {
      try {
        const parsedDate = parseISO(lastOnlineData);
        if (!isNaN(parsedDate.getTime())) {
          setLastOnline(parsedDate);
        } else {
          setLastOnline(null);
        }
      } catch (parseError) {
        console.error('Error parsing date with parseISO:', parseError);
        setLastOnline(null);
      }
    } else {
      setLastOnline(null);
    }
  };

  useEffect(() => {
    if (otherUserId) {
      // Reset the fetch tracker whenever user ID changes
      lastOnlineFetchedRef.current = false;
      
      if (!isOnline && !lastOnlineFetchedRef.current) {
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

    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId === otherUserId) {
        setIsOnline(true);
        setLastOnline(null);
      }
    };

    const handleUserOffline = async (data: { userId: string }) => {
      if (data.userId === otherUserId) {
        setIsOnline(false);
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

    socket.emit("get_online_users");

    const handleUserTyping = (data: { userId: string, chatRoomId: string }) => {
      if (data.userId === otherUserId && data.chatRoomId === chatRoomId) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string, chatRoomId: string }) => {
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
        <button
          onClick={handleBackToDashboard}
          className="flex flex-col items-center text-white hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mb-1" />
          <span className="text-xs">Dashboard</span>
        </button>

        <button 
          className={`flex flex-col items-center text-white ${showingSessions ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleSessions}
        >
          <BookOpen className="h-5 w-5 mb-1" />
          <span className="text-xs">Sessions</span>
        </button>

        <button 
          className={`flex flex-col items-center text-white ${showingMeetings ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleMeetings}
        >
          <Calendar className="h-5 w-5 mb-1" />
          <div className="flex items-center">
            <span className="text-xs">Meetings</span>
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