"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import { IMessage } from "@/types/chat";
import { CornerUpLeft } from "lucide-react";
// Import the extracted FileMessage and TextMessage components
import FileMessage from "./box/FileMessage";
import TextMessage from "./box/TextMessage";
// Import the API service
import { fetchChatMessages, markMessageAsRead } from "@/services/chatApiServices";

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

export default function MessageBox({
  userId,
  chatRoomId,
  socket,
  newMessage,
  onReplySelect,
}: MessageBoxProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [readStatus, setReadStatus] = useState<{ [key: string]: boolean }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Store refs for each message to enable scrolling to original message
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch chat history on mount
  useEffect(() => {
    async function fetchMessages() {
      try {
        const messagesData = await fetchChatMessages(chatRoomId);
        if (messagesData && messagesData.length > 0) {
          setMessages(messagesData);
          
          // Mark the most recent message as read if sent by another user
          const latestMessage = messagesData[messagesData.length - 1];
          if (
            latestMessage && 
            latestMessage.senderId !== userId && 
            !latestMessage.readStatus && 
            latestMessage._id
          ) {
            handleMarkMessageAsRead(latestMessage);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }
    fetchMessages();
  }, [chatRoomId, userId]);

  // Handle marking messages as read
  const handleMarkMessageAsRead = async (message: IMessage) => {
    if (!message._id || message.senderId === userId || message.readStatus) return;
    
    try {
      // Update in database
      await markMessageAsRead(message._id);
      
      // Emit socket event
      if (socket) {
        socket.emit("mark_message_read", {
          messageId: message._id,
          chatRoomId: chatRoomId,
          readerId: userId
        });
      }
      
      // Update local state
      setReadStatus(prev => ({
        ...prev,
        [message._id as string]: true
      }));
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  // Append new messages if they arrive
  useEffect(() => {
    if (!newMessage || newMessage.chatRoomId !== chatRoomId) return;
    
    setMessages(prev => [...prev, newMessage]);
    
    // Mark message as read if it's from another user
    if (newMessage.senderId !== userId && !newMessage.readStatus && newMessage._id) {
      handleMarkMessageAsRead(newMessage);
    }
  }, [newMessage, chatRoomId, userId]);

  // Listen for message read events
  useEffect(() => {
    if (!socket) return;

    const handleMessageRead = (data: { messageId: string }) => {
      setReadStatus(prev => ({
        ...prev,
        [data.messageId]: true
      }));
    };

    socket.on("message_read", handleMessageRead);

    return () => {
      socket.off("message_read", handleMessageRead);
    };
  }, [socket]);

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

  // Function to get the last message from the current user
  const getLastUserMessageIndex = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === userId) {
        return i;
      }
    }
    return -1;
  };

  const lastUserMessageIndex = getLastUserMessageIndex();

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full bg-white overflow-y-auto p-4">
      {messages.map((msg, i) => {
        const isMine = msg.senderId === userId;
        const isLastUserMessage = i === lastUserMessageIndex;
        
        return (
          <div
            key={msg._id || i}
            ref={(el) => {
              if (msg._id) messageRefs.current[msg._id] = el;
            }}
            className={`mb-3 flex flex-col ${isMine ? "items-end" : "items-start"}`}
          >
            <div
              className={`p-2 rounded-lg ${isMine ? "bg-secondary text-textcolor" : "bg-gray-200 text-black"} relative group`}
              style={{
                maxWidth: "75%",
                minWidth: "50px",
                minHeight: "30px",
                display: "flex",
                flexDirection: "column",
                wordBreak: "break-word"
              }}
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
                  className="reply-box rounded-md p-2 mb-1 cursor-pointer"
                  style={{
                    backgroundColor: "#e9ecef",
                    borderLeft: isMine ? "4px solid #25D366" : "4px solid #ccc",
                    maxWidth: "100%",
                    textAlign: "left",
                    borderRadius: "6px",
                  }}
                  onClick={() => {
                    if (msg.replyFor && typeof msg.replyFor === 'object' && '_id' in msg.replyFor) {
                      scrollToMessage((msg.replyFor as { _id: string })._id);
                    }
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: isMine ? "#25D366" : "#888" }}>
                    {typeof msg.replyFor === 'object' && 'senderId' in msg.replyFor 
                      ? ((msg.replyFor as { senderId: string }).senderId === userId ? "You" : (msg.replyFor as { senderId: string }).senderId) 
                      : "Unknown"}
                  </span>
                  <span
                    className="text-sm text-gray-700 truncate block"
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {typeof msg.replyFor === 'object' && 'content' in msg.replyFor 
                      ? (msg.replyFor as { content: string }).content 
                      : String(msg.replyFor)}
                  </span>
                </div>
              )}

              {/* Main message content or File */}
              {msg.content.startsWith("File:") ? (
                <FileMessage fileInfo={msg.content} />
              ) : (
                <TextMessage content={msg.content} />
              )}
              
              {/* Timestamp inside bubble */}
              <div className="flex justify-end items-center mt-1">
                <div
                  className="text-xs"
                  style={{
                    fontSize: "10px",
                    color: isMine ? "rgba(0, 0, 0, 0.8)" : "#777"
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
            
            {/* Read/delivered status BELOW message bubble */}
            {isMine && isLastUserMessage && (
              <div className="text-xs text-right mt-1 mr-2" style={{ color: "#62717A", fontSize: "10px" }}>
                {readStatus[msg._id as string] || msg.readStatus ? "read" : "delivered"}
              </div>
            )}
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