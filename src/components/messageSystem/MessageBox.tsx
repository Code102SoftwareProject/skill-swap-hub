"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSocket } from '@/lib/context/SocketContext';
import { IMessage } from "@/types/chat";
import { CornerUpLeft } from "lucide-react";
// Import the extracted FileMessage and TextMessage components
import FileMessage from "@/components/messageSystem/box/FileMessage";
import TextMessage from "@/components/messageSystem/box/TextMessage";
// Import the API service
import { fetchChatMessages, fetchChatRoom, fetchUserProfile } from "@/services/chatApiServices";

// Update the props interface to accept participant info
interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  newMessage?: IMessage;
  onReplySelect?: (message: IMessage) => void;
  participantInfo?: { id: string, name: string }; // Add this prop
}

// Add this type definition near the top of your file with other interfaces
interface ReplyContent {
  sender: string;
  content: string;
}

/**
 * ! TypingIndicator component 
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

// Extract reply component to improve readability
function ReplyPreview({ 
  replyInfo, 
  isMine, 
  onReplyClick 
}: { 
  replyInfo: { sender: string; content: string } | null;
  isMine: boolean;
  onReplyClick: () => void;
}) {
  if (!replyInfo) return null;
  
  return (
    <div
      className={`reply-box rounded-md p-2 mb-1 cursor-pointer bg-gray-100
        ${isMine ? "border-l-4 border-secondary" : "border-l-4 border-gray-400"}`}
      onClick={onReplyClick}
    >
      <span className={`text-xs font-semibold ${isMine ? "text-secondary" : "text-gray-600"}`}>
        {replyInfo.sender}
      </span>
      <span className="text-sm text-gray-700 truncate block">
        {replyInfo.content}
      </span>
    </div>
  );
}

export default function MessageBox({
  userId,
  chatRoomId,
  newMessage,
  onReplySelect,
  participantInfo,
}: MessageBoxProps) {
  const { socket, markMessageAsRead } = useSocket();
  
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store refs for each message to enable scrolling to original message
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());

  // Add state to store all participant names
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  // Add state for highlighted message
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Add state for last user message index
  const [lastUserMessageIndex, setLastUserMessageIndex] = useState<number>(-1);

  // Fetch participant names when component mounts or chatRoomId changes
  useEffect(() => {
    async function fetchParticipantNames() {
      try {
        // First add the participant info we already have
        const namesMap: Record<string, string> = {};
        if (participantInfo?.id && participantInfo?.name) {
          namesMap[participantInfo.id] = participantInfo.name;
        }
        
        // Get chat room info to find all participants
        const chatRoom = await fetchChatRoom(chatRoomId);
        if (chatRoom?.participants) {
          // For each participant we don't already have info for
          for (const participantId of chatRoom.participants) {
            // Skip current user and participants we already have
            if (participantId !== userId && !namesMap[participantId]) {
              const userData = await fetchUserProfile(participantId);
              if (userData) {
                namesMap[participantId] = `${userData.firstName} ${userData.lastName}`;
              }
            }
          }
        }
        
        setParticipantNames(namesMap);
      } catch (error) {
        console.error("Error fetching participant names:", error);
      }
    }
    
    fetchParticipantNames();
  }, [chatRoomId, userId, participantInfo]);

  // Fetch chat history on mount
  useEffect(() => {
    async function fetchMessages() {
      // Clear existing messages FIRST to prevent showing old messages
      setMessages([]);

      try {
        const messagesData = await fetchChatMessages(chatRoomId);
        if (messagesData && messagesData.length > 0) {
          setMessages(messagesData);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }
    fetchMessages();
  }, [chatRoomId, userId]);

  // Append new messages if they arrive
  useEffect(() => {
    if (!newMessage || newMessage.chatRoomId !== chatRoomId) return;
    setMessages((prev) => [...prev, newMessage]);
  }, [newMessage, chatRoomId, userId]);

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
  }, [messages, newMessage]);

  // Optimize by combining multiple message processing operations
  useEffect(() => {
    if (messages.length === 0) return;
    
    // Track both unread messages and last user message in one pass
    const unreadMessages: IMessage[] = [];
    let lastUserMsgIdx = -1;
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      
      // Check for unread messages
      if (msg.senderId !== userId && 
          msg._id && 
          !processedMessageIds.has(msg._id) &&
          msg.readStatus === false) {
        unreadMessages.push(msg);
      }
      
      // Find last user message (only once)
      if (lastUserMsgIdx === -1 && msg.senderId === userId) {
        lastUserMsgIdx = i;
      }
    }
    
    // Update last user message index
    if (lastUserMsgIdx !== -1) {
      setLastUserMessageIndex(lastUserMsgIdx);
    }
    
    // Handle unread messages...
    if (unreadMessages.length > 0) {
      // Extract just the IDs and filter out any undefined values
      const unreadIds = unreadMessages
        .map(msg => msg._id)
        .filter((id): id is string => id !== undefined);
      
      // Update local tracking state immediately to prevent duplicate requests
      const newProcessedIds = new Set([...processedMessageIds, ...unreadIds]);
      setProcessedMessageIds(newProcessedIds);
      
      // Use markMessageAsRead from context for each message ID
      Promise.all(unreadIds.map(messageId => 
        markMessageAsRead(messageId, chatRoomId, userId)
      ))
      .catch((error: unknown) => {
        console.error('Error marking messages as read:', error);
      });
    }
  }, [messages, userId, processedMessageIds, markMessageAsRead, chatRoomId]);

  // Function to scroll to a particular message (used for reply clicks)
  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 800);
    }
  };

  // Replace the getReplyContent function with this improved version
  const getReplyContent = (
    replyFor: string | { _id?: string; senderId?: string; content?: string }
  ): ReplyContent => {
    // Case 1: replyFor is a complete message object
    if (typeof replyFor === "object" && replyFor !== null) {
      if ("content" in replyFor && "senderId" in replyFor) {
        let senderName: string;
        
        if (replyFor.senderId === userId) {
          senderName = "You";
        } else {
          // Use fetched participant name or fallback to a generic name
          senderName = replyFor.senderId && participantNames[replyFor.senderId] 
            ? participantNames[replyFor.senderId] 
            : "Chat Partner";
        }
        
        return {
          sender: senderName,
          content: replyFor.content || "No content available"
        };
      }
    }
    
    // Case 2: replyFor is just an ID (string only)
    if (typeof replyFor === "string") {
      const replyId = replyFor;
      const originalMessage = messages.find(m => m._id === replyId);
      
      if (originalMessage && originalMessage.senderId) {
        let senderName: string;
        
        if (originalMessage.senderId === userId) {
          senderName = "You";
        } else {
          // Use fetched participant name or fallback
          senderName = participantNames[originalMessage.senderId] || "Chat Partner";
        }
        
        return {
          sender: senderName,
          content: originalMessage.content
        };
      }
    }
    
    // Fallback
    return {
      sender: "Unknown",
      content: typeof replyFor === "string" ? replyFor : "Message unavailable"
    };
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full bg-white overflow-y-auto p-4"
    >
      {messages.map((msg, i) => {
        const isMine = msg.senderId === userId;
        const isLastUserMessage = i === lastUserMessageIndex;
        
        // Get reply content if message has a reply reference
        const replyInfo = msg.replyFor ? getReplyContent(msg.replyFor) : null;

        return (
          <div
            key={msg._id || i}
            ref={(el) => {
              if (msg._id) messageRefs.current[msg._id] = el;
            }}
            className={`mb-3 flex flex-col ${isMine ? "items-end" : "items-start"} 
              ${msg._id === highlightedMessageId ? "bg-gray-100 bg-opacity-50" : ""}`}
          >
            <div
              className={`p-2 rounded-lg max-w-[75%] min-w-[50px] min-h-[30px] flex flex-col break-words
                ${isMine ? "bg-secondary text-textcolor" : "bg-gray-200 text-black"} 
                relative group`}
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
              <ReplyPreview 
                replyInfo={replyInfo} 
                isMine={isMine} 
                onReplyClick={() => {
                  if (
                    msg.replyFor &&
                    typeof msg.replyFor === "object" &&
                    "_id" in msg.replyFor
                  ) {
                    scrollToMessage((msg.replyFor as { _id: string })._id);
                  } else if (typeof msg.replyFor === "string") {
                    scrollToMessage(msg.replyFor);
                  }
                }}
              />

              {/* Main message content or File */}
              {msg.content.startsWith("File:") ? (
                <FileMessage fileInfo={msg.content} />
              ) : (
                <TextMessage content={msg.content} />
              )}

              {/* Timestamp inside bubble */}
              <div className="flex justify-end items-center mt-1">
                <div className={`text-xs text-[10px] ${isMine ? "text-black/80" : "text-gray-500"}`}>
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
