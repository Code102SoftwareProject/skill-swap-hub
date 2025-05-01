"use client";

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { fetchChatRoom, fetchUserProfile, fetchLastOnline } from "@/services/chatApiServices";
import { fetchUpcomingMeetingsCount } from "@/services/meetingApiServices"; 

interface ChatHeaderProps {
  chatRoomId: string;
  socket: Socket | null;
  userId: string;
  onToggleMeetings: (show: boolean) => void;
}

export default function ChatHeader({ chatRoomId, socket, userId, onToggleMeetings }: ChatHeaderProps) {
  const [upcomingMeetingsCount, setUpcomingMeetingsCount] = useState(0);
  const [chatRoomInfo, setChatRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [showingMeetings, setShowingMeetings] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchChatRoomInfo() {
      setLoading(true);
      setOtherUserName(null);
      setOtherUserId(null);
      setLastOnline(null);
      setIsOnline(false);
      
      try {
        const roomInfo = await fetchChatRoom(chatRoomId);
        
        if (roomInfo) {
          setChatRoomInfo(roomInfo);
          
          const foundOtherUserId = roomInfo.participants?.find((id: string) => id !== userId);
          if (foundOtherUserId) {
            setOtherUserId(foundOtherUserId);
          }
        } else {
          console.error('Failed to fetch chat room info or room not found');
          setChatRoomInfo(null);
        }
      } catch (error) {
        console.error('Error fetching chat room info:', error);
        setChatRoomInfo(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchChatRoomInfo();
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

    console.log('Fetching last online for user ID:', id);
    
    const lastOnlineData = await fetchLastOnline(id);
    
    if (lastOnlineData) {
      try {
        const parsedDate = parseISO(lastOnlineData);
        console.log('Parsed Date object:', parsedDate);
        
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
      fetchOtherUserName(otherUserId);
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

    const handleUserTyping = (data: { userId: string }) => {
      if (data.userId === otherUserId) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string }) => {
      if (data.userId === otherUserId) {
        setIsTyping(false);
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket, otherUserId]);

  useEffect(() => {
    if (!chatRoomId || !userId || !otherUserId) return;
    
    fetchUpcomingMeetingsCount(userId, otherUserId)
      .then(count => {
        setUpcomingMeetingsCount(count);
      })
      .catch(error => {
        console.error('Error getting upcoming meetings count:', error);
      });
  }, [chatRoomId, userId, otherUserId]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const handleToggleMeetings = () => {
    const newState = !showingMeetings;
    setShowingMeetings(newState);
    onToggleMeetings(newState);
  };

  if (loading) {
    return <div className="p-4">Loading chat header...</div>;
  }

  if (!chatRoomInfo || !otherUserId) {
    return <div className="p-4">Chat room not found or participant missing.</div>;
  }

  console.log('Rendering ChatHeader - isOnline:', isOnline, 'lastOnline state:', lastOnline, 'Other User Name:', otherUserName);

  return (
    <header className="flex items-center justify-between p-4 bg-primary border-b">
      <div>
        <h1 className="text-lg font-semibold text-white">
          {otherUserName || `Chat with ${otherUserId.substring(0, 8)}`}
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
          className="flex flex-col items-center text-white hover:text-blue-200 transition-colors"
          onClick={() => console.log('Sessions clicked')}
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