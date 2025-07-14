"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from '@/lib/context/SocketContext';
import { IMessage } from "@/types/chat";
import { CornerUpLeft } from "lucide-react";

import FileMessage from "@/components/messageSystem/box/FileMessage";
import TextMessage from "@/components/messageSystem/box/TextMessage";
import MessageSearch from "@/components/messageSystem/MessageSearch";

import { fetchChatMessages, fetchChatRoom, fetchUserProfile, markChatRoomMessagesAsRead } from "@/services/chatApiServices";


interface MessageBoxProps {
  userId: string;
  chatRoomId: string;
  newMessage?: IMessage;
  onReplySelect?: (message: IMessage) => void;
  participantInfo?: { id: string, name: string };
  showSearch?: boolean;
  onCloseSearch?: () => void;
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
    <div className="flex items-center justify-center my-2 md:my-4 w-full">
      <div className="bg-gray-100 text-gray-500 text-xs font-medium rounded-full px-2 md:px-3 py-1 font-body">
        {formattedDate}
      </div>
    </div>
  );
}

/**
 * SkillMatchInfoMessage component to show when chat was created due to skill match
 */
function SkillMatchInfoMessage({ participantName }: { participantName?: string }) {
  return (
    <div className="flex items-center justify-center my-4 md:my-6 w-full">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-blue-700 font-semibold text-sm font-body">
            New Skill Match! 🎉
          </span>
        </div>
        <p className="text-blue-600 text-sm font-body text-center">
          This chat was created because you and {participantName || 'your chat partner'} were matched based on your skills! 
          You can now discuss your skill exchange and schedule a skill sharing session.
        </p>
      </div>
    </div>
  );
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
      className={`reply-box rounded-md p-1 md:p-2 mb-1 cursor-pointer bg-gray-100
        ${isMine ? "border-l-4 border-secondary" : "border-l-4 border-gray-400"}`}
      onClick={onReplyClick}
    >
      <span className={`text-xs font-body font-semibold ${isMine ? "text-primary" : "text-gray-900"}`}>
        {replyInfo.sender}
      </span>
      <span className="text-xs md:text-sm font-body text-gray-700 truncate block">
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
  showSearch = false,
  onCloseSearch,
}: MessageBoxProps) {
  const { socket, onlineUsers } = useSocket();
  
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store refs for each message to enable scrolling to original message
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
 
  //  state to store all participant names
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});

  // state for highlighted message
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Search related states
  const [searchHighlightedMessageId, setSearchHighlightedMessageId] = useState<string | null>(null);

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
            // Skip current user
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

  // ! Append new messages if they arrive
  useEffect(() => {
    if (!newMessage || newMessage.chatRoomId !== chatRoomId) return;
    
    setMessages((prev) => [...prev, newMessage]);
  }, [newMessage, chatRoomId, userId, socket]);

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

  // Handle message delivery status updates
  useEffect(() => {
    if (!socket) return;

    // Remove this entire useEffect since we're removing delivery status
    return () => {};
  }, [socket, chatRoomId]);

  // Mark messages as read when entering chat room using API
  useEffect(() => {
    if (!chatRoomId || !userId) return;

    // Use API to mark unread messages as read (no sockets)
    const markMessagesRead = async () => {
      try {
        const result = await markChatRoomMessagesAsRead(chatRoomId, userId);
        if (result.success && result.modifiedCount > 0) {
          console.log(`Marked ${result.modifiedCount} messages as read`);
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesRead();
  }, [chatRoomId, userId]); // Only run when chat room or user changes, not on every message update

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

  // ! Function to scroll to a particular message 
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

  // Search handlers
  const handleSearchResult = useCallback((result: any) => {
    if (result?.message?._id) {
      setSearchHighlightedMessageId(result.message._id);
      scrollToMessage(result.message._id);
    } else {
      setSearchHighlightedMessageId(null);
    }
  }, []);

  const handleScrollToMessage = useCallback((messageId: string) => {
    scrollToMessage(messageId);
  }, []);

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
    <div className="flex flex-col w-full h-full bg-white overflow-hidden">
      {/* Search Component */}
      {showSearch && (
        <MessageSearch
          messages={messages}
          userId={userId}
          participantNames={participantNames}
          onSearchResult={handleSearchResult}
          onScrollToMessage={handleScrollToMessage}
          isVisible={showSearch}
          onClose={() => onCloseSearch?.()}
        />
      )}
      
      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex flex-col w-full h-full bg-white overflow-y-auto overflow-x-hidden p-2 md:p-4"
      >
      {/* Always show skill match info message at the top of new chat rooms */}
      <SkillMatchInfoMessage participantName={participantInfo?.name} />
      
      {messages.map((msg, i) => {
        const isMine = msg.senderId === userId;
        
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
              className={`mb-2 md:mb-3 flex flex-col ${isMine ? "items-end" : "items-start"} 
                ${msg._id === highlightedMessageId ? "bg-gray-100 bg-opacity-50" : ""} 
                ${msg._id === searchHighlightedMessageId ? "bg-yellow-100 bg-opacity-70" : ""}`}
            >
              <div
                className={`p-2 md:p-3 rounded-lg max-w-[85%] md:max-w-[75%] min-w-[50px] min-h-[30px] flex flex-col break-words word-wrap overflow-wrap-anywhere
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
                  <FileMessage 
                    fileInfo={msg.content} 
                    sentAt={msg.sentAt ? new Date(msg.sentAt) : undefined} 
                    isMine={isMine}
                  />
                ) : (
                  <TextMessage 
                    content={msg.content} 
                    sentAt={msg.sentAt ? new Date(msg.sentAt) : undefined} 
                    isMine={isMine}
                  />
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* ! IMPORTANT: Typing indicator section */}
      {isTyping && (
        <div className="mb-2 md:mb-3 text-left">
          <TypingIndicator />
        </div>
      )}
      </div>
    </div>
  );
}