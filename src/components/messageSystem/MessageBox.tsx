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
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    }
  }, [newMessage, chatRoomId]);

  if (loading) return <div>Loading messages...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {/* Chat Header */}
      <div className="p-3 bg-gray-100 border-b border-gray-300 text-sm font-semibold">
        Chat with {chatRoomId}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? <p className="text-gray-500">No messages yet in this chat.</p> : null}
        
        {messages.map((msg) => {
          const isMe = msg.senderId === userId;
          const isFile = msg.content.startsWith("http");

          return (
            <div key={msg._id} className={`mb-3 flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs px-3 py-2 rounded-lg shadow ${isMe ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>
                {/* Timestamp */}
                <div className="text-xs text-gray-300">{new Date(parseInt(msg.sentAt)).toLocaleString()}</div>

                {/* Message Content */}
                {isFile ? (
                  <a href={msg.content} target="_blank" rel="noopener noreferrer">
                    <img src={msg.content} alt="File" className="max-w-[200px] rounded-md mt-1 cursor-pointer hover:opacity-80" />
                  </a>
                ) : (
                  <p className="mt-1">{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
