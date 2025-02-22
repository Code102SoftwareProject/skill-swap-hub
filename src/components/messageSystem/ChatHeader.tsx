// /components/messageSystem/ChatHeader.tsx
'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

export default function ChatHeader({
  chatRoomId,
  socket,
  otherUserId,
}: {
  chatRoomId: string;
  socket: Socket | null;
  otherUserId: string;
}) {
  const [chatRoomInfo, setChatRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Fetch chat room info
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

  // Listen for online users and presence events
  useEffect(() => {
    if (!socket) return;

    // Request the current list of online users on mount
    socket.emit("get_online_users");

    const handleOnlineUsers = (users: string[]) => {
      // If the other user's ID is in the list, mark them online
      setIsOnline(users.includes(otherUserId));
    };

    // Listen for the snapshot of online users
    socket.on("online_users", handleOnlineUsers);

    // Listen for individual online/offline events
    const handleUserOnline = (data: { userId: string }) => {
      if (data.userId === otherUserId) setIsOnline(true);
    };
    const handleUserOffline = (data: { userId: string }) => {
      if (data.userId === otherUserId) setIsOnline(false);
    };

    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [socket, otherUserId]);

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
        <p className="text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
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
