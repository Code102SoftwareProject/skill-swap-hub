"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import { IMessage } from "@/types/types";
import { CornerUpLeft } from "lucide-react";
// Import the extracted FileMessage and TextMessage components
import FileMessage from "./Box/FileMessage";
import TextMessage from "./Box/TextMessage";

interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  socket: Socket | null;
  newMessage?: IMessage;
  onReplySelect?: (message: IMessage) => void;
}

/**
 * ! TypingIndicator component
 * @returns TypingIndicator component
 * @description A simple typing indicator component with 3 dots that bounce
 */
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

/**
 * ! MessageBox component
 * @param userId
 * @param chatRoomId
 * @param socket
 * @param newMessage
 * @@description A component to display chat messages in a chat room
 */

export default function MessageBox({
  userId,
  chatRoomId,
  socket,
  newMessage,
  onReplySelect,
}: MessageBoxProps) {
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
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }
    fetchMessages();
  }, [chatRoomId]);

  // Append new messages if they arrive and keep view scrolled to bottom
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
      messageElement.style.background = "rgba(255, 255, 0, 0.3)";
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
              className={`
                p-2 rounded-lg relative group
                max-w-[75%] min-w-[50px] min-h-[30px]
                flex flex-col break-words pb-1
                ${isMine ? "bg-secondary text-textcolor" : "bg-gray-200 text-black"}
              `}
            >
              {/* Reply button - show on hover */}
              <button 
                onClick={() => onReplySelect && msg._id && onReplySelect(msg)}
                className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Reply"
              >
                <CornerUpLeft className="w-3 h-3" />
              </button>

              {/* Reply box (if applicable) */}
              {msg.replyFor && (
                <div
                  className={`
                    reply-box rounded-md p-2 mb-1 cursor-pointer
                    max-w-full text-left
                    ${isMine 
                      ? "border-l-4 border-[#25D366] bg-[#e9ecef]" 
                      : "border-l-4 border-gray-300 bg-[#e9ecef]"
                    }
                  `}
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

              {/* Main message content or File */}
              {msg.content.startsWith("File:") ? (
                <FileMessage fileInfo={msg.content} />
              ) : (
                <TextMessage content={msg.content} />
              )}

              {/* Timestamp */}
              <div className={`
                flex justify-end text-[10px] mt-0.5 self-end
                ${isMine ? "text-black/80" : "text-gray-500"}
              `}>
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
