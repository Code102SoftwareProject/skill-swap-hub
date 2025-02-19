"use client";

import React, { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

interface IMessage {
  _id?: string;
  chatRoomId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  createdAt?: string;
  sentAt?: number; // optional if you want
}

interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  socket: Socket | null;
  newMessage?: IMessage;
}

export default function MessageBox({
  userId,
  chatRoomId,
  socket,
  newMessage,
}: MessageBoxProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);

  // 1) Fetch chat history on mount or when chatRoomId changes
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?chatRoomId=${chatRoomId}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }
    fetchMessages();
  }, [chatRoomId]);

  // 2) Whenever the parent sets a newMessage, append it
  useEffect(() => {
    if (!newMessage) return;
    if (newMessage.chatRoomId !== chatRoomId) return;

    // Append to local state
    setMessages((prev) => [...prev, newMessage]);
  }, [newMessage, chatRoomId]);

  return (
    <div className="flex flex-col w-full h-full bg-white overflow-y-auto p-4">
      {messages.map((msg, i) => {
        const isMine = msg.senderId === userId;
        return (
          <div key={msg._id || i} className={`mb-3 ${isMine ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block px-3 py-2 rounded ${
                isMine ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {msg.content}
            </span>
          </div>
        );
      })}
    </div>
  );
}
