"use client";

import { useEffect, useState } from "react";

interface IChatRoom {
  _id: string;
  participants: string[];
  createdAt: string;
  lastMessage?: {
    content: string;
    sentAt: string;
    senderId: string;
  };
}

interface SidebarProps {
  userId: string;
  onChatSelect: (chatRoomId: string) => void;
}

export default function Sidebar({ userId, onChatSelect }: SidebarProps) {
  const [chatRooms, setChatRooms] = useState<IChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChatRooms() {
      try {
        setLoading(true);
        const res = await fetch(`/api/chatrooms?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setChatRooms(data.chatRooms);
        } else {
          console.error("Error fetching chat rooms:", data.message);
        }
      } catch (err) {
        console.error("Error fetching chat rooms:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchChatRooms();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Chats</h2>
      <ul className="space-y-2">
        {chatRooms.map((chat) => {
          // The other participant is the ID that doesn't match the current user
          const otherParticipant = chat.participants.find((id) => id !== userId);
          return (
            <li
              key={chat._id}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
              onClick={() => onChatSelect(chat._id)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gray-600 rounded-full" />
                <span>Chat with user {otherParticipant}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
