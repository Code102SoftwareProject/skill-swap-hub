"use client";

import React, { useEffect, useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import { IMessage } from "@/types/chat";
import { CornerUpLeft } from "lucide-react";
// Import the extracted FileMessage and TextMessage components
import FileMessage from "@/components/messageSystem/box/FileMessage";
import TextMessage from "@/components/messageSystem/box/TextMessage";
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
 * ! TypingIndicator component with Tailwind styles
 */
function TypingIndicator() {
  return (
    <div className="flex gap-1 my-2.5">
      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></span>
      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></span>
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

  // Near your other state declarations
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  // Fetch chat history on mount
  useEffect(() => {
    async function fetchMessages() {
      // Clear existing messages FIRST to prevent showing old messages
      setMessages([]);

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

  useEffect(() => {
    async function fetchMessages() {
      // Fetch logic...
    }
    fetchMessages();
  }, [chatRoomId, userId]);

  // Handle marking messages as read
  const handleMarkMessageAsRead = async (message: IMessage) => {
    if (!message._id || message.senderId === userId) return; // Removed readStatus check to force updates

    try {
      console.log("Attempting to mark message as read:", message._id);

      // Update in database
      await markMessageAsRead(message._id);

      // Emit socket event with retry logic
      if (socket && socket.connected) {
        const readData = {
          messageId: message._id,
          chatRoomId: chatRoomId,
          readerId: userId,
          timestamp: Date.now(),
        };

        console.log("Emitting mark_message_read event:", readData);
        socket.emit("mark_message_read", readData);

        // Add retry mechanism for reliability
        setTimeout(() => {
          // If after 1 second the message still isn't marked as read locally, try again
          if (!readStatus[message._id as string]) {
            console.log("Read status not confirmed, retrying...");
            socket.emit("mark_message_read", readData);
          }
        }, 1000);
      } else {
        console.error("Socket not connected, can't mark message as read");
      }

      // Update local state
      setReadStatus((prev) => ({
        ...prev,
        [message._id as string]: true,
      }));

      // Also update the message in the messages array
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === message._id ? { ...msg, readStatus: true } : msg
        )
      );
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  // Append new messages if they arrive
  useEffect(() => {
    if (!newMessage || newMessage.chatRoomId !== chatRoomId) return;

    setMessages((prev) => [...prev, newMessage]);

    // Mark message as read if it's from another user
    if (
      newMessage.senderId !== userId &&
      !newMessage.readStatus &&
      newMessage._id
    ) {
      handleMarkMessageAsRead(newMessage);
    }
  }, [newMessage, chatRoomId, userId]);

  // Automatically mark new incoming messages as read
  useEffect(() => {
    // Only process if this is a new message from someone else
    if (
      newMessage &&
      newMessage.chatRoomId === chatRoomId &&
      newMessage.senderId !== userId &&
      !newMessage.readStatus &&
      newMessage._id
    ) {
      // Small delay to ensure the message is rendered first
      const timer = setTimeout(() => {
        handleMarkMessageAsRead(newMessage);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [newMessage, chatRoomId, userId]);

  // Listen for message read events
  useEffect(() => {
    if (!socket) return;

    console.log("Setting up message_read listener for chatRoomId:", chatRoomId);

    const handleMessageRead = (data: {
      messageId: string;
      chatRoomId: string;
      readerId: string;
    }) => {
      // Only process this event if it's for the current chat room
      if (data.chatRoomId !== chatRoomId) return;

      console.log(
        `Message ${data.messageId} marked as read by ${data.readerId}`
      );

      // Update both states immediately and directly
      setReadStatus((prev) => ({ ...prev, [data.messageId]: true }));
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === data.messageId ? { ...msg, readStatus: true } : msg
        )
      );
    };

    socket.on("message_read", handleMessageRead);

    return () => {
      socket.off("message_read", handleMessageRead);
    };
  }, [socket, chatRoomId, userId]);

  // Add/update typing event listeners
  useEffect(() => {
    if (!socket) return;

    // Reset typing status when chat changes
    setIsTyping(false);

    // Add additional logging to track socket events
    console.log("Setting up all message listeners for chatRoomId:", chatRoomId);

    // Add explicit debug event to check socket connectivity
    socket.emit("debug_connection", {
      userId,
      chatRoomId,
      timestamp: new Date().toISOString(),
    });

    const handleUserTyping = (data: { userId: string; chatRoomId: string }) => {
      // Only show typing indicator if it's for the current chat room
      if (data.chatRoomId === chatRoomId && data.userId !== userId) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: {
      userId: string;
      chatRoomId: string;
    }) => {
      // Only process typing events for the current chat room
      if (data.chatRoomId === chatRoomId && data.userId !== userId) {
        setIsTyping(false);
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket, chatRoomId, userId]);

  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    if (containerRef.current) {
      // Add a small delay to ensure complete rendering
      setTimeout(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages, newMessage]); // Add newMessage as dependency

  // Update this when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const newestMessage = messages[messages.length - 1];
      if (newestMessage._id && newestMessage._id !== lastMessageId) {
        setLastMessageId(newestMessage._id);
      }
    }
  }, [messages]);

  // Auto-read all unread messages when entering a chat room
  useEffect(() => {
    // When we enter a chat room, mark all unread messages from other users as read
    if (messages.length > 0 && socket) {
      // Find all unread messages from other users
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== userId && !msg.readStatus && msg._id
      );

      // Mark each one as read with a slight delay between them
      if (unreadMessages.length > 0) {
        // Only mark the latest message to avoid spamming
        const latestMessage = unreadMessages[unreadMessages.length - 1];
        handleMarkMessageAsRead(latestMessage);
      }
    }
  }, [chatRoomId, messages, socket, userId]);

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
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full bg-white overflow-y-auto p-4"
    >
      {messages.map((msg, i) => {
        const isMine = msg.senderId === userId;
        const isLastUserMessage = i === lastUserMessageIndex;

        return (
          <div
            key={msg._id || i}
            ref={(el) => {
              if (msg._id) messageRefs.current[msg._id] = el;
            }}
            className={`mb-3 flex flex-col ${
              isMine ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                isMine
                  ? "bg-secondary text-textcolor"
                  : "bg-gray-200 text-black"
              } relative group`}
              style={{
                maxWidth: "75%",
                minWidth: "50px",
                minHeight: "30px",
                display: "flex",
                flexDirection: "column",
                wordBreak: "break-word",
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
                    borderLeft: isMine
                      ? "4px solid #25D366"
                      : "4px solid #ccc",
                    maxWidth: "100%",
                    textAlign: "left",
                    borderRadius: "6px",
                  }}
                  onClick={() => {
                    if (
                      msg.replyFor &&
                      typeof msg.replyFor === "object" &&
                      "_id" in msg.replyFor
                    ) {
                      scrollToMessage((msg.replyFor as { _id: string })._id);
                    }
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isMine ? "#25D366" : "#888" }}
                  >
                    {typeof msg.replyFor === "object" && "senderId" in msg.replyFor
                      ? (msg.replyFor as { senderId: string }).senderId ===
                        userId
                        ? "You"
                        : (msg.replyFor as { senderId: string }).senderId
                      : "Unknown"}
                  </span>
                  <span
                    className="text-sm text-gray-700 truncate block"
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {typeof msg.replyFor === "object" && "content" in msg.replyFor
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
                    color: isMine ? "rgba(0, 0, 0, 0.8)" : "#777",
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