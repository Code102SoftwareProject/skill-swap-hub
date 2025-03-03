"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import { IMessage } from "@/types/types";


interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  socket: Socket | null;
  newMessage?: IMessage;
}

// Typing Indicator Component dot dot dot
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

export default function MessageBox({ userId, chatRoomId, socket, newMessage }: MessageBoxProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store refs for each message to enable scrolling to original message
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch chat history on mount (keeping the order as received so that the latest message is at the bottom)
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?chatRoomId=${chatRoomId}`);
        const data = await res.json();
        if (data.success) {
         //show messages
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }
    fetchMessages();
  }, [chatRoomId]);

  // Append new messages if they arrive eep view scrolled to bottom
  useEffect(() => {
    if (!newMessage) return;
    if (newMessage.chatRoomId !== chatRoomId) return;
    setMessages((prev) => [...prev, newMessage]);
  }, [newMessage, chatRoomId]);

  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Function to scroll to a particular message (used for reply clicks)
  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Brief highlight effect
      messageElement.style.transition = "background 0.3s";
      messageElement.style.background = "rgba(255, 255, 0, 0.3)"; // Light yellow
      setTimeout(() => {
        messageElement.style.background = "transparent";
      }, 800);
    }
  };

  // Listen for typing events via socket
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

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full bg-white overflow-y-auto p-4">
      {messages.map((msg, i) => {
        const isMine = msg.senderId === userId;
        return (
          <div
            key={msg._id || i}
            ref={(el) => {
              if (msg._id) messageRefs.current[msg._id] = el;
            }}
            className={`mb-1 flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-2 rounded-lg ${isMine ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
              style={{
                maxWidth: "75%",
                minWidth: "50px",
                minHeight: "30px",
                display: "flex",
                flexDirection: "column",
                wordBreak: "break-word",
                paddingBottom: "4px",
              }}
            >
              {/* Reply box (if applicable) */}
              {msg.replyFor && (
                <div
                  className="reply-box rounded-md p-2 mb-1 cursor-pointer"
                  style={{
                    backgroundColor: "#e9ecef",
                    borderLeft: isMine ? "4px solid #25D366" : "4px solid #ccc",
                    maxWidth: "100%",
                    textAlign: "left",
                    borderRadius: "6px",
                  }}
                  onClick={() => msg.replyFor?._id && scrollToMessage(msg.replyFor._id)}
                >
                  <span className="text-xs font-semibold" style={{ color: isMine ? "#25D366" : "#888" }}>
                    {msg.replyFor.senderId === userId ? "You" : msg.replyFor.senderId}
                  </span>
                  <span
                    className="text-sm text-gray-700 truncate block"
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {msg.replyFor.content}
                  </span>
                </div>
              )}

              {/* Main message content */}
              <span className="block">{msg.content}</span>

              {/* Timestamp */}
              <div
                className="flex justify-end text-xs"
                style={{
                  fontSize: "10px",
                  color: isMine ? "#cce5ff" : "#777",
                  marginTop: "2px",
                  textAlign: "right",
                  alignSelf: "flex-end",
                }}
              >
                {msg.sentAt
                  ? new Date(msg.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {isTyping && (
        <div className="mb-3 text-left">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
}
