//@/components/messageSystem/ChatHeader.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ChatHeader({ chatRoomId }: { chatRoomId: string }) {
  const [chatRoomInfo, setChatRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChatRoomInfo() {
      try {
        const response = await fetch(`/api/chatrooms?chatRoomId=${chatRoomId}`);
        const data = await response.json();
        if (data.success) {
          setChatRoomInfo(data.chatRooms[0]); // Assuming the first entry is the current chat room
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching chat room info:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchChatRoomInfo();
  }, [chatRoomId]);

  if (loading) {
    return <div className="p-4">Loading chat header...</div>;
  }

  if (!chatRoomInfo) {
    return <div className="p-4">Chat room not found.</div>;
  }

  return (
    <header className="flex items-center justify-between p-4 bg-gray-50 border-b">
      <div>
        <h1 className="text-lg font-semibold">{chatRoomInfo.name || `Chat Room ${chatRoomId}`}</h1>
        <p className="text-sm text-gray-500">Response time: 1 hour</p>
      </div>
      <div className="flex space-x-2">
        <button className="px-4 py-2 text-sm bg-white border rounded-lg">Back to Dashboard</button>
        <button className="px-4 py-2 text-sm bg-white border rounded-lg">View Sessions</button>
      </div>
    </header>
  );
}
