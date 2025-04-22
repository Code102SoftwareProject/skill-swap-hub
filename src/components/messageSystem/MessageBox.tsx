"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import { IMessage } from "@/types/types";
import { CornerUpLeft } from "lucide-react";
// Import the extracted FileMessage and TextMessage components
import FileMessage from "./Box/FileMessage";
import TextMessage from "./Box/TextMessage";
// Add MessageStatus to imports
import MessageStatus from './Box/MessageStatus';

interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  socket: Socket | null;
  newMessage?: IMessage;
  onReplySelect?: (message: IMessage) => void;
}

/**
 * @component TypingIndicator
 * @description Renders an animated typing indicator with three bouncing dots
 * @returns {JSX.Element} A div containing three animated dots
 * @example
 * <TypingIndicator />
 */
function TypingIndicator() {
  return (
    <div className="typing-indicator flex items-center">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
      <div className="flex gap-1 my-2.5">
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}

/**
 * @component MessageBox
 * @description A comprehensive chat message display component that handles both text and file messages,
 * supports reply functionality, and displays typing indicators.
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - The ID of the current user
 * @param {string} props.chatRoomId - The ID of the current chat room
 * @param {Socket|null} props.socket - Socket.io instance for real-time communication
 * @param {IMessage} [props.newMessage] - New message to be displayed
 * @param {Function} [props.onReplySelect] - Callback function when reply is selected
 * 
 * @features
 * - Real-time message updates
 * - Message reply functionality
 * - File message support
 * - Typing indicators
 * - Auto-scrolling
 * - Message highlighting on reply reference
 * 
 * @example
 * <MessageBox 
 *   userId="user123"
 *   chatRoomId="room456"
 *   socket={socketInstance}
 *   newMessage={latestMessage}
 *   onReplySelect={(message) => handleReply(message)}
 * />
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

  /**
   * @function scrollToMessage
   * @description Scrolls to and briefly highlights a referenced message
   * @param {string} messageId - The ID of the message to scroll to
   */
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

  /**
   * @effect
   * @description Fetches chat history when component mounts
   * @dependencies [chatRoomId]
   */
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

  /**
   * @effect
   * @description Handles new message updates and scrolling
   * @dependencies [newMessage, chatRoomId]
   */
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

  /**
   * @effect
   * @description Manages typing indicator events through socket
   * @dependencies [socket, userId]
   */
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

  // Update the message read status function
  const updateMessageReadStatus = async (messageId: string) => {
    try {
      // Update local state first for immediate feedback
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, readStatus: true } : msg
      ));

      // Then update backend
      const response = await fetch('/api/messages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update message status');
      }

      // Emit socket event after successful backend update
      if (socket) {
        socket.emit("message_seen", chatRoomId, userId);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      // Revert local state if backend update fails
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, readStatus: false } : msg
      ));
    }
  };

  // Update the Intersection Observer effect
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId) {
            const message = messages.find(m => m._id === messageId);
            if (message && !message.readStatus && message.senderId !== userId) {
              updateMessageReadStatus(messageId);
            }
          }
        }
      });
    });

    // Observe unread messages from other users
    messages.forEach(msg => {
      if (!msg.readStatus && msg.senderId !== userId && msg._id) {
        const element = messageRefs.current[msg._id];
        if (element) {
          observer.observe(element);
        }
      }
    });

    return () => observer.disconnect();
  }, [messages, userId, socket, chatRoomId]);

  // Update the socket effect for handling seen messages
  useEffect(() => {
    if (!socket) return;

    const handleMessageSeen = ({ userId: seenByUserId }: { userId: string }) => {
      setMessages(prevMessages => prevMessages.map(msg => {
        // If message is from current user and seen by other user
        if (msg.senderId === userId && seenByUserId !== userId) {
          return { ...msg, readStatus: true };
        }
        // If message is from other user and seen by current user
        if (msg.senderId === seenByUserId && seenByUserId !== userId) {
          return { ...msg, readStatus: true };
        }
        return msg;
      }));
    };

    socket.on("user_see_message", handleMessageSeen);

    return () => {
      socket.off("user_see_message", handleMessageSeen);
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
            data-message-id={msg._id}
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

              {/* Timestamp and Status */}
              <div className={`
                flex items-center justify-end text-[10px] mt-0.5 self-end gap-1
                ${isMine ? "text-black/80" : "text-gray-500"}
              `}>
                <span>
                  {msg.sentAt
                    ? new Date(msg.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
                {isMine && <MessageStatus readStatus={msg.readStatus} />}
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
