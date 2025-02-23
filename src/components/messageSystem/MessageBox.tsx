"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";

interface IMessage {
  _id?: string;
  chatRoomId: string;
  senderId: string;
  receiverId?: string;
  content: string;
  createdAt?: string;
  sentAt?: number;
}

interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  socket: Socket | null;
  newMessage?: IMessage;
}

// A small component that shows three bouncing dots
function TypingIndicator() {
  return (
    <div className="typing-indicator flex items-center">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
      <style jsx>{`
        .typing-indicator {
          display: flex;
          gap: 4px;
          margin: 10px 0;
        }
        .dot {
          width: 8px;
          height: 8px;
          background-color: #ccc;
          border-radius: 50%;
          animation: bounce 1.4s infinite;
        }
        .dot:nth-child(1) {
          animation-delay: 0s;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default function MessageBox({
  userId,
  chatRoomId,
  socket,
  newMessage,
}: MessageBoxProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 2) Append new messages coming in real-time
  useEffect(() => {
    if (!newMessage) return;
    if (newMessage.chatRoomId !== chatRoomId) return;
    setMessages((prev) => [...prev, newMessage]);
  }, [newMessage, chatRoomId]);

  // 3) Listen for typing events from the other user
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: { userId: string }) => {
      // Only set typing if the event is from someone other than the current user.
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

  // 4) Scroll to the bottom when messages or typing indicator update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full bg-white overflow-y-auto p-4"
    >
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
              <span
                className={`text-[10px] ml-2 align-bottom ${isMine ? "text-white" : "text-black"}`}
              >
                {msg.sentAt
                  ? new Date(msg.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </span>
          </div>
        );
      })}

      {/* Render the typing indicator if the other user is typing */}
      {isTyping && (
        <div className="mb-3 text-left">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
}
