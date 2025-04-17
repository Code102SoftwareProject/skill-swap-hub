"use client";

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';

interface ChatHeaderProps {
  chatRoomId: string;
  socket: Socket | null;
  userId: string; // current user id
}

export default function ChatHeader({ chatRoomId, socket, userId }: ChatHeaderProps) {
  const [chatRoomInfo, setChatRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  // Fetch chat room info (e.g., room name, participants, etc.)
  useEffect(() => {
    async function fetchChatRoomInfo() {
      try {
        const response = await fetch(`/api/chatrooms?chatRoomId=${chatRoomId}`);
        const data = await response.json();
        if (data.success) {
          setChatRoomInfo(data.chatRooms[0]);
        }
      } catch (error) {
        console.error('Error fetching chat room info:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchChatRoomInfo();
  }, [chatRoomId]);

  // Move fetchLastOnline outside useEffect so it can be reused
  const fetchLastOnline = async () => {
    if (!chatRoomInfo?.participants) {
      console.log('No participants found');
      return;
    }

    const otherUserId = chatRoomInfo.participants.find((id: string) => id !== userId);
    if (!otherUserId) {
      console.log('Could not find other user');
      return;
    }

    try {
      const response = await fetch(`/api/onlinelog?userId=${otherUserId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Last online response:', data);

      if (data.success && data.data?.lastOnline) {
        setLastOnline(new Date(data.data.lastOnline));
      } else {
        setLastOnline(null);
      }
    } catch (error: any) {
      console.error('error fetching last online:', error);
      setLastOnline(null);
    }
  };

  // Modify the useEffect for online status
  useEffect(() => {
    if (!socket) return;

    // Request the current online users list
    socket.emit("get_online_users");

    const handleOnlineUsers = (users: string[]) => {
      const otherUserOnline = users.find((id) => id !== userId);
      setIsOnline(!!otherUserOnline);
      // If user goes offline, fetch their last seen time
      if (!otherUserOnline && chatRoomInfo?.participants) {
        fetchLastOnline();
      }
    };

    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId !== userId) {
        setIsOnline(true);
        setLastOnline(null); // Clear last seen when user comes online
      }
    };

    const handleUserOffline = async (data: { userId: string }) => {
      if (data.userId !== userId) {
        setIsOnline(false);
        // Fetch last seen immediately when user goes offline
        await fetchLastOnline();
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
  }, [socket, userId, chatRoomInfo]);

  // Listen for typing events from any user other than the current user
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: { userId: string }) => {
      if (data.userId !== userId) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string }) => {
      if (data.userId !== userId) {
        setIsTyping(false);
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket, userId]);

  // Modified useEffect for initial fetch of last online status
  useEffect(() => {
    if (chatRoomInfo?.participants && !isOnline) {
      fetchLastOnline();
    }
  }, [chatRoomInfo, isOnline]);

  if (loading) {
    return <div className="p-4">Loading chat header...</div>;
  }

  if (!chatRoomInfo) {
    return <div className="p-4">Chat room not found.</div>;
  }

  return (
    <header className="flex items-center justify-between p-4 bg-gray-50 border-b">
      <div>
        <h1 className="text-lg font-semibold">
          {chatRoomInfo.name || `Chat Room ${chatRoomId}`}
        </h1>
        <p className="text-sm text-gray-500">
          {isTyping ? 'Typing...' : (
            isOnline ? 'Online' : (
              lastOnline ? `Last seen ${formatDistanceToNow(lastOnline, { addSuffix: true })}` : 'Offline'
            )
          )}
        </p>
      </div>
      <div className="flex space-x-2">
        <button className="px-4 py-2 text-sm bg-white border rounded-lg">
          Back to Dashboard
        </button>
        <button className="px-4 py-2 text-sm bg-white border rounded-lg">
          View Sessions
        </button>
      </div>
    </header>
  );
}