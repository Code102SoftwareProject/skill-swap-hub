"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSocket } from '@/lib/context/SocketContext';
import { IMessage } from "@/types/chat";
import { CornerUpLeft } from "lucide-react";

import FileMessage from "@/components/messageSystem/box/FileMessage";
import TextMessage from "@/components/messageSystem/box/TextMessage";

import { fetchChatMessages, fetchChatRoom, fetchUserProfile } from "@/services/chatApiServices";


interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  newMessage?: IMessage;
  onReplySelect?: (message: IMessage) => void;
  participantInfo?: { id: string, name: string }; 
}


interface ReplyContent {
  sender: string;
  content: string;
}

/**
 * DateBadge component to show date separators between messages
 */
function DateBadge({ date }: { date: Date }) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }).format(date);
  
  return (
    <div className="flex items-center justify-center my-3 sm:my-4 w-full">
      <div className="bg-gray-100 text-gray-500 text-xs sm:text-sm font-medium rounded-full px-2 py-1 sm:px-3">
        {formattedDate}
      </div>
    </div>
  );
}

/**
 * ! TypingIndicator component 
 */
function TypingIndicator() {
  return (
    <div className="flex gap-1 my-2 sm:my-2.5 pl-2 sm:pl-0">
      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full animate-bounce"></span>
      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full animate-bounce delay-75"></span>
      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full animate-bounce delay-150"></span>
    </div>
  );
}

//  ! Reply Message 
function ReplyMessage({ 
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
      className={`reply-box rounded-md p-1.5 sm:p-2 mb-1 cursor-pointer bg-gray-100
        ${isMine ? "border-l-4 border-secondary" : "border-l-4 border-gray-400"}`}
      onClick={onReplyClick}
    >
      <span className={`text-xs font-semibold ${isMine ? "text-primary" : "text-gray-900"}`}>
        {replyInfo.sender}
      </span>
      <span className="text-xs sm:text-sm text-gray-700 truncate block">
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
  const { socket } = useSocket();
  
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store refs for each message to enable scrolling to original message
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());

  //  state to store all participant names
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  // state for highlighted message
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // state for last user message index
  const [lastUserMessageIndex, setLastUserMessageIndex] = useState<number>(-1);

  // Helper function to check if two dates are from different days
  const isNewDay = (date1: Date | string | undefined, date2: Date | string | undefined): boolean => {
    if (!date1 || !date2) return false;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() !== d2.getFullYear() ||
          d1.getMonth() !== d2.getMonth() ||
          d1.getDate() !== d2.getDate();
  };

  // ! Fetch participant names when component mounts or chatRoomId changes
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

  // ! Fetch chat history on mount
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

  // ! Auto-scroll to the bottom when messages update
  useEffect(() => {
    if (containerRef.current) {
      // delay for complete render
      setTimeout(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages, newMessage]);

  // ! unction to scroll to a particular message 
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


  const getReplyContent = (
    replyFor: string | { _id?: string; senderId?: string; content?: string }
  ): ReplyContent => {
    
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
    
    // NEW: Handle case where replyFor is just a message ID string
    if (typeof replyFor === "string") {
      // Find the original message in the current messages array
      const originalMessage = messages.find(msg => msg._id === replyFor);
      
      if (originalMessage) {
        let senderName: string;
        
        if (originalMessage.senderId === userId) {
          senderName = "You";
        } else {
          // Use fetched participant name or fallback to a generic name
          senderName = originalMessage.senderId && participantNames[originalMessage.senderId] 
            ? participantNames[originalMessage.senderId] 
            : "Chat Partner";
        }
        
        return {
          sender: senderName,
          content: originalMessage.content || "No content available"
        };
      }
    }
    
    // Fallback
    return {
      sender: "Unknown",
      content: typeof replyFor === "string" ? "Message not found" : "Message unavailable"
    };
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-full bg-white overflow-y-auto p-1 sm:p-2 md:p-4"
    >
      {messages.map((msg, i) => {
        const isMine = msg.senderId === userId;
        const isLastUserMessage = i === lastUserMessageIndex;
        
        // Get current message date
        const currentDate = msg.sentAt ? new Date(msg.sentAt) : undefined;
        // Get previous message date (if any)
        const prevDate = i > 0 && messages[i-1]?.sentAt ? new Date(messages[i-1].sentAt!) : undefined;
        
        // Display date badge if this is the first message or if it's a new day compared to previous message
        const showDateBadge = i === 0 || isNewDay(currentDate, prevDate);
        
        // Get reply content if message has a reply reference
        const replyInfo = msg.replyFor ? getReplyContent(msg.replyFor) : null;

        return (
          <React.Fragment key={msg._id || `msg-${i}`}>
            {showDateBadge && currentDate && <DateBadge date={currentDate} />}
            <div
              ref={(el) => {
                if (msg._id) messageRefs.current[msg._id] = el;
              }}
              className={`mb-1.5 sm:mb-2 md:mb-3 flex flex-col ${isMine ? "items-end" : "items-start"} 
                ${msg._id === highlightedMessageId ? "bg-gray-100 bg-opacity-50" : ""}`}
            >
              <div
                className={`p-2 sm:p-2.5 md:p-3 rounded-lg max-w-[90%] sm:max-w-[85%] md:max-w-[75%] min-w-[50px] min-h-[30px] flex flex-col break-words
                  ${isMine ? "bg-secondary text-textcolor" : "bg-gray-200 text-black"} 
                  relative group`}
              >
                {/* Reply button - show on hover, smaller on mobile */}
                <button
                  onClick={() => onReplySelect && msg._id && onReplySelect(msg)}
                  className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-white/80 p-0.5 sm:p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Reply"
                >
                  <CornerUpLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>

                {/* Reply box for Reply Messages */}
                <ReplyMessage 
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
                  <FileMessage fileInfo={msg.content} sentAt={msg.sentAt ? new Date(msg.sentAt) : undefined} isMine={isMine} />
                ) : (
                  <TextMessage content={msg.content} sentAt={msg.sentAt ? new Date(msg.sentAt) : undefined} isMine={isMine} />
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* ! IMPORTANT: Typing indicator section */}
      {isTyping && (
        <div className="mb-2 sm:mb-3 text-left">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
}