"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/lib/context/SocketContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen, Search } from 'lucide-react';
import { fetchChatRoom, fetchUserProfile, fetchLastOnline } from "@/services/chatApiServices";
import { hasActiveOrPendingSessions, hasUpcomingOrPendingMeetings } from "@/services/sessionApiServices";

interface ChatHeaderProps {
  chatRoomId: string;
  userId: string;
  onToggleMeetings: (show: boolean) => void;
  onToggleSessions: (show: boolean) => void;
  onToggleSearch?: (show: boolean) => void;
  onSessionUpdate?: () => void; // Add callback for session updates
  initialParticipantInfo?: { id: string, name: string };
  showingMeetings?: boolean;
  showingSessions?: boolean;
  showingSearch?: boolean;
  sessionUpdateTrigger?: number; // Trigger to refresh session status
}

export default function ChatHeader({ 
  chatRoomId, 
  userId, 
  onToggleMeetings,
  onToggleSessions,
  onToggleSearch,
  onSessionUpdate,
  initialParticipantInfo,
  showingMeetings = false,
  showingSessions = false,
  showingSearch = false,
  sessionUpdateTrigger = 0
}: ChatHeaderProps) {
  const { socket, onlineUsers, refreshOnlineUsers } = useSocket(); // Get onlineUsers from socket context
  
  const [isTyping, setIsTyping] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [hasActiveSessions, setHasActiveSessions] = useState(false);
  const [hasActiveMeetings, setHasActiveMeetings] = useState(false);
  
  const [otherUserName, setOtherUserName] = useState<string | null>(
    initialParticipantInfo?.name || "Chat Participant"
  );
  const [otherUserId, setOtherUserId] = useState<string | null>(
    initialParticipantInfo?.id || null
  );

  // Calculate online status directly from socket context for instant updates
  const isOnline = otherUserId ? onlineUsers.includes(otherUserId) : false;
  
  const router = useRouter();

  useEffect(() => {
    if (initialParticipantInfo?.id && !otherUserId) {
      setOtherUserId(initialParticipantInfo.id);
    }
  }, [initialParticipantInfo, otherUserId]);

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

  // Memoized function to avoid recreating it on every render
  const fetchUserLastOnlineMemoized = useCallback(fetchUserLastOnline, []);

  const checkActiveSessions = useCallback(async () => {
    try {
      const hasActivePendingSessions = await hasActiveOrPendingSessions(userId);
      setHasActiveSessions(hasActivePendingSessions);
    } catch (error) {
      console.error('Error checking active sessions:', error);
      setHasActiveSessions(false);
    }
  }, [userId]);

  const checkActiveMeetings = useCallback(async () => {
    try {
      const hasActivePendingMeetings = await hasUpcomingOrPendingMeetings(userId);
      setHasActiveMeetings(hasActivePendingMeetings);
    } catch (error) {
      console.error('Error checking active meetings:', error);
      setHasActiveMeetings(false);
    }
  }, [userId]);

  // Fetch last online time when user goes offline (using onlineUsers from context)
  useEffect(() => {
    if (otherUserId && !isOnline && !lastOnline) {
      // Only fetch if user is offline and we don't have last online data
      fetchUserLastOnlineMemoized(otherUserId);
    } else if (otherUserId && isOnline) {
      // Clear last online when user comes online
      setLastOnline(null);
    }
  }, [otherUserId, isOnline, lastOnline, fetchUserLastOnlineMemoized]);

  // Request online users list when otherUserId is available
  useEffect(() => {
    if (otherUserId && socket) {
      refreshOnlineUsers(); // Use the function from socket context
    }
  }, [otherUserId, socket, refreshOnlineUsers]);

  // Check for active/pending sessions when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      checkActiveSessions();
      checkActiveMeetings();
      
      // Set up periodic refresh every 60 seconds (reduced from 30)
      const interval = setInterval(() => {
        checkActiveSessions();
        checkActiveMeetings();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [userId, checkActiveSessions, checkActiveMeetings]);

  // React to session update trigger changes
  useEffect(() => {
    if (sessionUpdateTrigger > 0) {
      checkActiveSessions();
      checkActiveMeetings();
    }
  }, [sessionUpdateTrigger, checkActiveSessions, checkActiveMeetings]);

  // Listen for real-time socket events for instant updates
  useEffect(() => {
    if (!socket || !otherUserId) return;

    // Request initial online users when we have both socket and otherUserId
    refreshOnlineUsers();

    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId === otherUserId) {
        // User came online - clear last online timestamp
        setLastOnline(null);
      }
    };

    const handleUserOffline = (data: { userId: string }) => {
      if (data.userId === otherUserId) {
        // User went offline - fetch updated last online time with slight delay
        setTimeout(() => {
          fetchUserLastOnlineMemoized(otherUserId);
        }, 500); // Reduced delay for faster updates
      }
    };

    // Listen to socket events for instant updates
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [socket, otherUserId, refreshOnlineUsers, fetchUserLastOnlineMemoized]);

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
    // Refresh active meetings check when toggling meetings view
    if (!showingMeetings) {
      checkActiveMeetings();
    }
  };

  const handleToggleSessions = () => {
    onToggleSessions(!showingSessions);
    // Refresh active sessions check when toggling sessions view
    if (!showingSessions) {
      checkActiveSessions();
    }
  };

  return (
    <header className="flex items-center justify-between p-2 md:p-4 bg-primary border-b">
      <div className="flex-1 min-w-0">
        <h1 className="text-base md:text-lg font-semibold text-white font-heading truncate">
          {otherUserName || `Chat ${chatRoomId.substring(0, 8)}`}
        </h1>
        <p className="text-xs md:text-sm text-blue-100 font-body truncate">
          {getStatusText()}
        </p>
      </div>
      
      <div className="flex space-x-2 md:space-x-4 flex-shrink-0">
        {/* Back to Dashboard Button */}
        <button
          onClick={handleBackToDashboard}
          className="flex flex-col items-center text-white hover:text-blue-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mb-1" />
          <span className="text-xs font-body hidden md:block">Dashboard</span>
        </button>
        
        {/* Search Button */}
        <button 
          className={`flex flex-col items-center text-white ${showingSearch ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={() => onToggleSearch?.(!showingSearch)}
        >
          <Search className="h-5 w-5 mb-1" />
          <span className="text-xs font-body hidden md:block">Search</span>
        </button>

        {/* Session Button */}
        <button 
          className={`relative flex flex-col items-center text-white ${showingSessions ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleSessions}
        >
          <div className="relative">
            <BookOpen className="h-5 w-5 mb-1" />
            {hasActiveSessions && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
            )}
          </div>
          <span className="text-xs font-body hidden md:block">Sessions</span>
        </button>

        {/* Meetings Button */}
        <button 
          className={`relative flex flex-col items-center text-white ${showingMeetings ? 'text-blue-200' : 'hover:text-blue-200'} transition-colors`}
          onClick={handleToggleMeetings}
        >
          <div className="relative">
            <Calendar className="h-5 w-5 mb-1" />
            {hasActiveMeetings && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-xs font-body hidden md:block">Meetings</span>
          </div>
        </button>
      </div>
    </header>
  );
}