"use client";

import React, { useEffect, useState } from "react";

interface IMessage {
  _id: string;
  chatRoomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string;
  readStatus: boolean;
  __v: number;
}

interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  newMessage?: IMessage; // ✅ Accept newMessage as a prop
}

export default function MessageBox({ userId, chatRoomId, newMessage }: MessageBoxProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/messages?chatRoomId=${chatRoomId}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch messages");
        }

        setMessages(data.messages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [chatRoomId]);

  // ✅ Update messages dynamically when a new message is sent
  useEffect(() => {
    if (newMessage && newMessage.chatRoomId === chatRoomId) {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    }
  }, [newMessage, chatRoomId]);

  if (loading) {
    return <div>Loading messages...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {/* Simple top bar  */}
      <div className="p-2 bg-gray-100 border-b border-gray-300">
        <strong>You:</strong> {userId}
      </div>
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 && <p>No messages yet in this chat.</p>}
        {messages.map((msg) => {
          const isMe = msg.senderId === userId;
          return (
            <div key={msg._id} className={`mb-2 ${isMe ? "text-right" : "text-left"}`}>
              {/* Time stamp */}
              <div className="text-xs text-gray-500">{new Date(msg.sentAt).toLocaleString()}</div>
              {/* Message bubble */}
              <div className={`inline-block px-3 py-2 rounded mt-1 ${isMe ? "bg-blue-100" : "bg-gray-200"}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
