"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IMessage } from "@/types/chat";
import { ChevronRight } from "lucide-react";

// Force dynamic rendering for this page since it uses search parameters
export const dynamic = 'force-dynamic';

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";
import MeetingBox from "@/components/messageSystem/MeetingBox";
import SessionBox from "@/components/messageSystem/SessionBox";
import { useAuth } from "@/lib/context/AuthContext";
import { useSocket } from "@/lib/context/SocketContext"; // Import the socket hook
import { ApiOptimizationProvider } from "@/lib/context/ApiOptimizationContext";
import { fetchChatRoom, markChatRoomMessagesAsRead, fetchUserChatRooms } from "@/services/chatApiServices";
import { preloadChatMessages, updateCachedMessages, setProgressCallback } from "@/services/messagePreloader";

/**
 * ChatPageContent - Inner component that uses search params
 */
function ChatPageContent() {
  // * Authentication state from context
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?._id;
  const searchParams = useSearchParams(); // Get URL search parameters

  // * Get socket from context instead of managing it locally
  const { socket, joinRoom, sendMessage, startTyping, stopTyping} = useSocket();
  
  // ! Core state for chat functionality
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [selectedParticipantInfo, setSelectedParticipantInfo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);
  
  // * UI state for different view modes
  const [showMeetings, setShowMeetings] = useState<boolean>(false);
  const [showSessions, setShowSessions] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sessionUpdateTrigger, setSessionUpdateTrigger] = useState<number>(0);
  const [messagesPreloaded, setMessagesPreloaded] = useState<boolean>(false);
  const [preloadProgress, setPreloadProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });
  const [forceRefresh, setForceRefresh] = useState<boolean>(false); // Add state to force refresh

  // Check if user came from dashboard and handle auto-selection of chat room
  useEffect(() => {
    const fromDashboard = searchParams ? searchParams.get('from') === 'dashboard' : false;
    const roomId = searchParams ? searchParams.get('roomId') : null;
    
    if (fromDashboard) {
      setForceRefresh(true);
      // Reset the flag after a short delay to avoid affecting subsequent navigations
      setTimeout(() => setForceRefresh(false), 1000);
    }
    
    // Auto-select chat room if roomId is provided
    if (roomId && userId) {
      // Retry mechanism for newly created chat rooms
      const trySelectRoom = async (attempts = 0) => {
        const maxAttempts = 3;
        
        try {
          // Check if the room exists in user's chat rooms
          const chatRooms = await fetchUserChatRooms(userId);
          const roomExists = chatRooms.some(room => room._id === roomId);
          
          if (roomExists) {
            handleChatSelect(roomId);
          } else if (attempts < maxAttempts) {
            // Room might still be being created, wait and retry
            setTimeout(() => trySelectRoom(attempts + 1), 1000);
          } else {
            console.warn(`Chat room ${roomId} not found after ${maxAttempts} attempts`);
          }
        } catch (error) {
          console.error('Error finding chat room:', error);
        }
      };
      
      // Small delay to ensure sidebar is loaded, then try to select room
      setTimeout(() => trySelectRoom(), 500);
    }
  }, [searchParams, userId]);

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

  const toggleSearchDisplay = (show: boolean) => {
    setShowSearch(show);
    if (show) {
      setShowMeetings(false); // Hide meetings when showing search
      setShowSessions(false); // Hide sessions when showing search
    }
  };

  const handleSessionUpdate = () => {
    // Trigger re-render for ChatHeader to refresh session status
    setSessionUpdateTrigger(prev => prev + 1);
  };

  const handleMeetingUpdate = useCallback(() => {
    // Trigger re-render for ChatHeader to refresh meeting status
    setSessionUpdateTrigger(prev => prev + 1);
  }, []);

  const handleChatSelect = async (chatRoomId: string, participantInfo?: any) => {
    setSelectedChatRoomId(chatRoomId);
    setNewMessage(null); // Reset new message state when changing chats
    setSidebarOpen(false); // Close sidebar on mobile when chat is selected
    if (participantInfo) {
      setSelectedParticipantInfo(participantInfo);
    }

    // Mark messages as read when chat is selected
    if (userId) {
      try {
        await markChatRoomMessagesAsRead(chatRoomId, userId);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  const handleBackToSidebar = () => {
    setSelectedChatRoomId(null);
    setSelectedParticipantInfo(null);
    setShowMeetings(false);
    setShowSessions(false);
    setShowSearch(false);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * Preload messages for all chat rooms in the background
   */
  useEffect(() => {
    const preloadAllMessages = async () => {
      if (!userId || messagesPreloaded) return;

      try {
        console.log('Starting background message preloading...');
        
        // Set up progress callback
        setProgressCallback((loaded, total) => {
          setPreloadProgress({ loaded, total });
        });
        
        const chatRooms = await fetchUserChatRooms(userId);
        
        if (chatRooms && chatRooms.length > 0) {
          setPreloadProgress({ loaded: 0, total: chatRooms.length });
          
          // Preload messages in the background
          await preloadChatMessages(chatRooms);
          setMessagesPreloaded(true);
          console.log(`Successfully preloaded messages for ${chatRooms.length} chat rooms`);
          
          // Hide progress after a short delay
          setTimeout(() => {
            setPreloadProgress({ loaded: 0, total: 0 });
          }, 2000);
        }
      } catch (error) {
        console.error('Error preloading messages:', error);
      }
    };

    // Start preloading after a short delay to not interfere with initial page load
    const timeoutId = setTimeout(preloadAllMessages, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [userId, messagesPreloaded]);

  /**
   * * Fetch chat participants whenever selected chat room changes
   * resets UI view modes
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
    setShowSearch(false);
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
      
      // Update cached messages for this room
      updateCachedMessages(message.chatRoomId, message as any);
    };

    // ! set up the message listener locally
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
    <ApiOptimizationProvider>
      <div className="flex h-screen relative overflow-hidden">
        {/* * Sidebar Overlay for mobile - appears when sidebarOpen is true */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* * Mobile Sidebar Toggle Arrow - visible only on mobile when sidebar is closed */}
        {!sidebarOpen && selectedChatRoomId && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed left-0 top-1/2 transform -translate-y-1/2 z-30 
                       bg-white bg-opacity-80 hover:bg-opacity-100 
                       border border-gray-300 rounded-r-lg shadow-lg
                       p-2 transition-all duration-200 ease-in-out"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* * Chat sidebar with conversation list - responsive behavior with slide-out */}
        <div className={`
          ${selectedChatRoomId && !sidebarOpen ? 'hidden md:block' : 'block'} 
          ${sidebarOpen ? 'translate-x-0' : selectedChatRoomId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
          fixed md:relative w-full md:w-64 h-full bg-white z-50 md:z-auto
          flex-shrink-0 transition-transform duration-300 ease-in-out
        `}>
          <Sidebar 
            userId={userId} 
            selectedChatRoomId={selectedChatRoomId} 
            onChatSelect={handleChatSelect}
            preloadProgress={preloadProgress}
          />
        </div>

        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${!selectedChatRoomId ? 'hidden md:flex' : 'flex'}`}>
          {selectedChatRoomId ? (
            <>
              {/* * Chat header with participant info and controls */}
              <ChatHeader
                chatRoomId={selectedChatRoomId}
                userId={userId}
                onToggleMeetings={toggleMeetingsDisplay}
                onToggleSessions={toggleSessionsDisplay}
                onToggleSearch={toggleSearchDisplay}
                onSessionUpdate={handleSessionUpdate}
                initialParticipantInfo={selectedParticipantInfo}
                showingSessions={showSessions}
                showingMeetings={showMeetings}
                showingSearch={showSearch}
                sessionUpdateTrigger={sessionUpdateTrigger}
              />

              {/* * Main content area - conditionally renders messages, meetings or sessions */}
              <div className="flex-1 overflow-auto min-w-0">
                {showMeetings ? (
                  <MeetingBox
                    chatRoomId={selectedChatRoomId}
                    userId={userId}
                    onClose={() => setShowMeetings(false)}
                    onMeetingUpdate={handleMeetingUpdate}
                  />
                ) : showSessions ? (
                  <SessionBox
                    chatRoomId={selectedChatRoomId}
                    userId={userId}
                    otherUserId={selectedParticipantInfo?.id || chatParticipants.find(id => id !== userId) || ''}
                    onSessionUpdate={handleSessionUpdate}
                  />
                ) : (
                  <MessageBox
                    chatRoomId={selectedChatRoomId}
                    userId={userId}
                    newMessage={newMessage}
                    onReplySelect={handleReplySelect}
                    participantInfo={selectedParticipantInfo}
                    showSearch={showSearch}
                    onCloseSearch={() => setShowSearch(false)}
                    skipCache={forceRefresh}
                  />
                )}
              </div>

              {/* * Message input area - only shown when not in meetings/sessions/search view */}
              {!showMeetings && !showSessions && !showSearch && (
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
    </ApiOptimizationProvider>
  );
}

/**
 * * ChatPage Component
 * Main component wrapped with Suspense for useSearchParams
 * Uses centralized socket context for connection management
 */
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading chat...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}