"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/context/SocketContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen, Menu } from 'lucide-react';
import { fetchChatRoom, fetchUserProfile, fetchLastOnline } from "@/services/chatApiServices";

interface ChatHeaderProps {
  chatRoomId: string;
  userId: string;
  onToggleMeetings: (show: boolean) => void;
  onToggleSessions: (show: boolean) => void;
  initialParticipantInfo?: { id: string, name: string };
  showingMeetings?: boolean;
  showingSessions?: boolean;
  onToggleSidebar?: () => void;
}

export default function ChatHeader({ 
  chatRoomId, 
  userId, 
  onToggleMeetings,
  onToggleSessions,
  initialParticipantInfo,
  showingMeetings = false,
  showingSessions = false,
  onToggleSidebar
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

  const fetchUserLastOnline = async (id: string) => {
    if (!id) {
      console.log('No other user ID provided to fetchLastOnline');
      return;
    }
    
    try {
      const lastOnlineData = await fetchLastOnline(id);

      if (lastOnlineData) {
        const parsedDate = parseISO(lastOnlineData);
        if (!isNaN(parsedDate.getTime())) {
          setLastOnline(parsedDate);
        } else {
          console.error('Invalid date received:', lastOnlineData);
          setLastOnline(null);
        }
      } else {
        console.log('No last online data received for user:', id);
        setLastOnline(null);
      }
    } catch (parseError) {
      console.error('Error parsing date with parseISO:', parseError);
      setLastOnline(null);
    }
  };

  useEffect(() => {
    if (otherUserId && socket) {
      socket.emit("get_online_users");
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
        setTimeout(() => {
          fetchUserLastOnline(otherUserId);
        }, 1000);
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

  const getStatusText = () => {
    if (isTyping) {
      return 'Typing...';
    }
    
    if (isOnline) {
      return 'Online';
    }
    
    if (lastOnline instanceof Date && !isNaN(lastOnline.getTime())) {
      return `Last seen ${formatDistanceToNow(lastOnline, { addSuffix: true })}`;
    }
    
    return 'Offline';
  };

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
    <header className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-primary border-b">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        {/* Mobile hamburger menu */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-white hover:text-blue-200 transition-colors p-1 flex-shrink-0"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white font-heading truncate">
            {otherUserName || `Chat ${chatRoomId.substring(0, 8)}`}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 font-body truncate">
            {getStatusText()}
          </p>
        </div>
      </div>

      <div className="flex space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
        {/* Back to Dashboard - Hidden on small mobile */}
        <button
          onClick={handleBackToDashboard}
          className="hidden sm:flex flex-col items-center text-white hover:text-blue-200 transition-colors px-1"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mb-0.5 sm:mb-1" />
          <span className="text-xs font-body">Dashboard</span>
        </button>

        {/* Session Button */}
        <button 
          className={`flex flex-col items-center text-white px-1 sm:px-2 ${showingSessions ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleSessions}
        >
          <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mb-0.5 sm:mb-1" />
          <span className="text-xs font-body hidden sm:block">Sessions</span>
        </button>

        {/* Meetings Button */}
        <button 
          className={`flex flex-col items-center text-white px-1 sm:px-2 ${showingMeetings ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleMeetings}
        >
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mb-0.5 sm:mb-1" />
          <span className="text-xs font-body hidden sm:block">Meetings</span>
        </button>
      </div>
    </header>
  );
}