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
  newMessage?: IMessage;
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

  useEffect(() => {
    if (newMessage && newMessage.chatRoomId === chatRoomId) {
      setMessages((prevMessages) => {
        const isDuplicate = prevMessages.some((msg) => msg._id === newMessage._id);
        return isDuplicate ? prevMessages : [...prevMessages, newMessage];
      });
    }
  }, [newMessage, chatRoomId]);

  if (loading) return <div>Loading messages...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="p-3 bg-gray-100 border-b border-gray-300 text-sm font-semibold">
        Chat with {chatRoomId}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => {
          const isMe = msg.senderId === userId;
          return (
            <div key={msg._id} className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs px-3 py-2 rounded-lg shadow ${isMe ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
                <div className="text-xs text-gray-300">{new Date(parseInt(msg.sentAt)).toLocaleString()}</div>
                <p className="mt-1">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
