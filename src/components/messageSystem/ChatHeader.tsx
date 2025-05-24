"use client";

import { useEffect, useState } from 'react';
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
  initialParticipantInfo?: { id: string, name: string };
  showingMeetings?: boolean;
  showingSessions?: boolean;
}

export default function ChatHeader({ 
  chatRoomId, 
  userId, 
  onToggleMeetings,
  onToggleSessions,
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
      
      // If user is not online, fetch their last online time
      if (!isOtherUserOnline) {
        fetchUserLastOnline(otherUserId);
      } else {
        // Clear last online when user comes online
        setLastOnline(null);
      }
    };

    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId === otherUserId) {
        setIsOnline(true);
        setLastOnline(null); // Clear last online when user comes online
      }
    };

    const handleUserOffline = async (data: { userId: string }) => {
      if (data.userId === otherUserId) {
        setIsOnline(false);
        // Immediately fetch the updated last online status when user goes offline
        setTimeout(() => {
          fetchUserLastOnline(otherUserId);
        }, 1000); // Small delay to ensure the server has updated the last online time
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

  // Function to get the status text
  const getStatusText = () => {
    if (isTyping) {
      return 'Typing...';
    }
    
    if (isOnline) {
      return 'Online';
    }
    
    // User is offline, show last seen if available
    if (lastOnline instanceof Date && !isNaN(lastOnline.getTime())) {
      return `Last seen ${formatDistanceToNow(lastOnline, { addSuffix: true })}`;
    }
    
    // Fallback to "Offline" only if no last online data is available
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
    <header className="flex items-center justify-between p-4 bg-primary border-b">
      <div>
        <h1 className="text-lg font-semibold text-white font-heading">
          {otherUserName || `Chat ${chatRoomId.substring(0, 8)}`}
        </h1>
        <p className="text-sm text-blue-100 font-body">
          {getStatusText()}
        </p>
      </div>
      <div className="flex space-x-4">
        {/* Back to Dashboard*/}
        <button
          onClick={handleBackToDashboard}
          className="flex flex-col items-center text-white hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mb-1" />
          <span className="text-xs font-body">Dashboard</span>
        </button>
        {/* Session Button */}
        <button 
          className={`flex flex-col items-center text-white ${showingSessions ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleSessions}
        >
          <BookOpen className="h-5 w-5 mb-1" />
          <span className="text-xs font-body">Sessions</span>
        </button>

        {/* Meetings Button */}
        <button 
          className={`flex flex-col items-center text-white ${showingMeetings ? 'text-blue-200 text-xs'  : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleMeetings}
        >
          <Calendar className="h-5 w-5 mb-1" />
          <div className="flex items-center">
            <span className="text-xs font-body">Meetings</span>
          </div>
        </button>
      </div>
    </header>
  );
}