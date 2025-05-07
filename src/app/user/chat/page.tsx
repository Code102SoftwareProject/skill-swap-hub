"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { IMessage } from "@/types/chat";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";
import MeetingBox from "@/components/messageSystem/MeetingBox";
import SessionBox from "@/components/messageSystem/SessionBox";
import { useAuth } from "@/lib/context/AuthContext";
import { updateLastSeen, fetchChatRoom } from "@/services/chatApiServices";

/**
 * * ChatPage Component
 * Main component for handling user messaging functionality
 * Includes socket connection management, chat selection, and message display
 */
export default function ChatPage() {
  // * Authentication state from context
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?._id;

  // ! Core state for socket communication 
  const [socket, setSocket] = useState<Socket | null>(null);
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
    // ? Is this condition working as expected? It toggles off immediately
    if (show){
      setShowMeetings(false);
    }
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
   * ! Primary useEffect for socket initialization
   * Sets up socket connection and handles component cleanup
   * Updates last seen status and manages beforeUnload events
   */
  useEffect(() => {
    if (!userId || authLoading) return;

    updateLastSeen(userId).catch(console.error);

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET, { transports: ["websocket"] });
    setSocket(newSocket);

    // * Browser close handler - sends last status update via beacon
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/onlinelog', JSON.stringify({ userId }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // ! Critical cleanup function on page umount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      updateLastSeen(userId)
        .then(() => {
          newSocket.disconnect();
        })
        .catch(console.error);
    };
  }, [userId, authLoading]);

  /**
   * * Emit online presence when socket or userId changes
   */
  useEffect(() => {
    if (!socket || !userId) return;
    socket.emit("presence_online", { userId });
  }, [socket, userId]);

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
   * ! Socket message handling effect
   * Sets up room joining and message listeners when chat room is selected
   */
  useEffect(() => {
    if (!socket || !selectedChatRoomId || !userId) return;

    socket.emit("join_room", {
      chatRoomId: selectedChatRoomId,
      userId,
    });

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

    socket.on("receive_message", handleReceiveMessage);

    // * Clean up socket listeners on unmount or when dependencies change
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, selectedChatRoomId, userId]);

  /**
   * * Component unmount handler for last seen status
   * ! Note: This runs only once on mount and cleanup on unmount
   * ? Consider adding userId to dependency array for reactive updates
   */
  useEffect(() => {
    if (!userId) return;
    
    // Component gets unmounted when page is closed
    return () => {
      if (userId) {
        console.log('Component unmounting, updating last seen status');
        updateLastSeen(userId).catch(console.error);
      }
    };
  }, []);

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
      <Sidebar userId={userId} onChatSelect={handleChatSelect} />

      <div className="flex-1 flex flex-col">
        {selectedChatRoomId ? (
          <>
            {/* * Chat header with participant info and controls */}
            <ChatHeader
              chatRoomId={selectedChatRoomId}
              socket={socket}
              userId={userId}
              onToggleMeetings={toggleMeetingsDisplay}
              onToggleSessions={toggleSessionsDisplay}
              upcomingMeetingsCount={0}
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
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  onClose={() => setShowSessions(false)}
                />
              ) : (
                <MessageBox
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  socket={socket}
                  newMessage={newMessage}
                  onReplySelect={handleReplySelect}
                />
              )}
            </div>

            {/* * Message input area - only shown when not in meetings/sessions view */}
            {!showMeetings && !showSessions && (
              <div className="border-t p-2 bg-white">
                <MessageInput
                  socket={socket}
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
