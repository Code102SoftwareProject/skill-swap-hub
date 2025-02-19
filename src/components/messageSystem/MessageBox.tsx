"use client";

import React, { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

interface IMessage {
  _id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  sentAt: number;
}

interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  socket: Socket | null;
  newMessage?: IMessage;
  typingUsers?: { [key: string]: boolean }; // optional
}

export default function MessageBox({
  userId,
  chatRoomId,
  socket,
  newMessage,
  typingUsers = {},
}: MessageBoxProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);

  // Fetch messages on load
  useEffect(() => {
    async function fetchMessages() {
      const res = await fetch(`/api/messages?chatRoomId=${chatRoomId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    }
    fetchMessages();
  }, [chatRoomId]);

  // Handle new incoming messages
  useEffect(() => {
    if (!newMessage) return;
    if (newMessage.chatRoomId !== chatRoomId) return;

    setMessages((prev) => [...prev, newMessage]);
  }, [newMessage, chatRoomId]);

  // We can figure out who’s typing, excluding ourselves
  const typingUserIds = Object.keys(typingUsers).filter((u) => u !== userId);

  return (
    <div className="flex flex-col w-full h-full bg-white overflow-y-auto p-4">
      {/* Display all messages */}
      {messages.map((msg) => (
        <div
          key={msg._id}
          className={`mb-3 ${msg.senderId === userId ? "text-right" : "text-left"}`}
        >
          <span
            className={`inline-block px-3 py-2 rounded ${
              msg.senderId === userId
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            {msg.content}
          </span>
        </div>
      ))}

      {/* Show "User is typing" if there's any other user actively typing */}
      {typingUserIds.length > 0 && (
        <div className="text-sm text-gray-500 mt-2">
          {typingUserIds.join(", ")} {typingUserIds.length === 1 ? "is" : "are"} typing...
        </div>
      )}
    </div>
  );
}
