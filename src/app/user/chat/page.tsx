"use client";

import React, { useState, useEffect } from "react";
import { IMessage } from "@/types/chat";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";
import MeetingBox from "@/components/messageSystem/MeetingBox";
import SessionBox from "@/components/messageSystem/SessionBox";
import { useAuth } from "@/lib/context/AuthContext";
import { useSocket } from "@/lib/context/SocketContext"; // Import the socket hook
import { fetchChatRoom } from "@/services/chatApiServices";

/**
 * * ChatPage Component
 * Main component for handling user messaging functionality
 * Uses centralized socket context for connection management
 */
export default function ChatPage() {
  // * Authentication state from context
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?._id;

  // * Get socket from context instead of managing it locally
  const { socket, joinRoom, sendMessage, startTyping, stopTyping, markMessageAsRead } = useSocket();
  
  // ! Core state for chat functionality
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [selectedParticipantInfo, setSelectedParticipantInfo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);
  
  // * UI state for different view modes
  const [showMeetings, setShowMeetings] = useState<boolean>(false);
  const [showSessions, setShowSessions] = useState<boolean>(false);

  /**
   * * Event Handlers
   */
  const handleReplySelect = (message: IMessage) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const toggleMeetingsDisplay = (show: boolean) => {
    setShowMeetings(show);
  };

  const toggleSessionsDisplay = (show: boolean) => {
    setShowSessions(show);
    if (show) setShowMeetings(false); // Hide meetings when showing sessions
  };

  const handleChatSelect = (chatRoomId: string, participantInfo?: any) => {
    setSelectedChatRoomId(chatRoomId);
    setNewMessage(null); // Reset new message state when changing chats
    if (participantInfo) {
      setSelectedParticipantInfo(participantInfo);
    }
  };

  /**
   * * Fetch chat participants whenever selected chat room changes
   * Also resets UI view modes
   */
  useEffect(() => {
    if (!selectedChatRoomId) return;

    async function getChatRoomParticipants() {
      const chatRoom = await fetchChatRoom(selectedChatRoomId as string);
      if (chatRoom) {
        setChatParticipants(chatRoom.participants || []);
      }
    }

    getChatRoomParticipants();
    setShowMeetings(false);
    setShowSessions(false);
  }, [selectedChatRoomId, userId]);

  /**
   * * Join chat room when selected and socket is available
   */
  useEffect(() => {
    if (!socket || !selectedChatRoomId || !userId) return;

    // Use the joinRoom function from the context
    joinRoom(selectedChatRoomId);

    interface IReceivedMessage {
      chatRoomId: string;
      [key: string]: any;
    }

    const handleReceiveMessage = (message: IReceivedMessage): void => {
      if (message.chatRoomId === selectedChatRoomId) {
        setNewMessage({
          ...message,
          timestamp: Date.now(),
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        });
      }
    };

    // Still need to set up the message listener locally
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, selectedChatRoomId, userId, joinRoom]);

  /**
   * * Loading and authentication state handlers
   */
  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || !userId) {
    return <div className="flex h-screen items-center justify-center">Please log in to access chat</div>;
  }

  /**
   * * Main component render
   * Structured with sidebar and main content area
   */
  return (
    <div className="flex h-screen">
      {/* * Chat sidebar with conversation list */}
      <Sidebar 
        userId={userId} 
        selectedChatRoomId={selectedChatRoomId} 
        onChatSelect={handleChatSelect} 
      />

      <div className="flex-1 flex flex-col">
        {selectedChatRoomId ? (
          <>
            {/* * Chat header with participant info and controls */}
            <ChatHeader
              chatRoomId={selectedChatRoomId}
              userId={userId}
              onToggleMeetings={toggleMeetingsDisplay}
              onToggleSessions={toggleSessionsDisplay}
              initialParticipantInfo={selectedParticipantInfo}
              showingSessions={showSessions}
              showingMeetings={showMeetings}
            />

            {/* * Main content area - conditionally renders messages, meetings or sessions */}
            <div className="flex-1 overflow-auto">
              {showMeetings ? (
                <MeetingBox
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  onClose={() => setShowMeetings(false)}
                />
              ) : showSessions ? (
                <SessionBox    
                />
              ) : (
                <MessageBox
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  newMessage={newMessage}
                  onReplySelect={handleReplySelect}
                  participantInfo={selectedParticipantInfo}  // Add this prop
                />
              )}
            </div>

            {/* * Message input area - only shown when not in meetings/sessions view */}
            {!showMeetings && !showSessions && (
              <div className="border-t p-2 bg-white">
                <MessageInput
                  chatRoomId={selectedChatRoomId}
                  senderId={userId}
                  replyingTo={replyingTo}
                  onCancelReply={handleCancelReply}
                  chatParticipants={chatParticipants}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p>Select a chat room from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
}