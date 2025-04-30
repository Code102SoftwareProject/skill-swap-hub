"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import { IMessage } from "@/types/chat";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";
import MeetingBox from "@/components/messageSystem/MeetingBox";
import { useAuth } from "@/lib/context/AuthContext";
import { updateLastSeen, fetchChatRoom, fetchUpcomingMeetingsCount as fetchMeetings} from "@/services/chatApiServices";

/**
 * Main chat page component that handles messaging functionality
 * @returns JSX component
 */
export default function ChatPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const userId = user?._id; // Extract user ID from auth context

  // * Core state for chat functionality
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);
  const [showMeetings, setShowMeetings] = useState<boolean>(false);
  const [upcomingMeetingsCount, setUpcomingMeetingsCount] = useState(0);

  /**
   * Sets a message as the reply target
   * @param message - The message being replied to
   */
  const handleReplySelect = (message: IMessage) => {
    setReplyingTo(message);
  };

  /**
   * Cancels the current reply action
   */
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  /**
   * Toggles the meetings view
   * @param show - Whether to show meetings
   */
  const toggleMeetingsDisplay = (show: boolean) => {
    setShowMeetings(show);
  };

  // * Initialize Socket.IO connection when component mounts
  useEffect(() => {
    if (!userId || authLoading) return; // Don't connect if user isn't loaded yet
    
    // Initial online status update
    updateLastSeen(userId).catch(console.error);

    // ! Production socket endpoint
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET, { transports: ["websocket"] });
    // ? Development socket endpoint
    // const newSocket = io("http://localhost:3001", { transports: ["websocket"] });
    setSocket(newSocket);

    /**
     * Handles browser close/refresh events
     * Uses sendBeacon for reliable delivery during page unload
     */
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/onlinelog', JSON.stringify({ userId }));
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Update last seen before disconnecting
      updateLastSeen(userId)
        .then(() => {
          newSocket.disconnect();
        })
        .catch(console.error);
    };
  }, [userId, authLoading]);

  // * Mark user as online when socket is ready
  useEffect(() => {
    if (!socket || !userId) return;
    socket.emit("presence_online", { userId });
  }, [socket, userId]);

  // * Fetch participants when chat room is selected
  useEffect(() => {
    if (!selectedChatRoomId) return;
    
    async function getChatRoomParticipants() {
      const chatRoom = await fetchChatRoom(selectedChatRoomId as string);
      if (chatRoom) {
        setChatParticipants(chatRoom.participants || []);
      }
    }
    
    getChatRoomParticipants();
    // When switching chat rooms, reset the meeting view
    setShowMeetings(false);
  }, [selectedChatRoomId, userId]);

  // * Fetch upcoming meetings count when chat room is selected
  useEffect(() => {
    if (!selectedChatRoomId || !userId) return;
    
    // Fetch meeting count when chat room changes
    fetchMeetings(selectedChatRoomId, userId)
      .then(count => {
        setUpcomingMeetingsCount(count);
      })
      .catch(error => {
        console.error('Error getting initial meetings count:', error);
      });
  }, [selectedChatRoomId, userId]);

  // * Set up socket event listeners for messages
  useEffect(() => {
    if (!socket || !selectedChatRoomId || !userId) return;

    socket.emit("join_room", {
      chatRoomId: selectedChatRoomId,
      userId,
    });

    /**
     * Interface for incoming message structure
     */
    interface IReceivedMessage {
      chatRoomId: string;
      [key: string]: any;
    }

    /**
     * Handles incoming messages from other users
     * @param message - The message data received
     */
    const handleReceiveMessage = (message: IReceivedMessage): void => {
      if (message.chatRoomId === selectedChatRoomId) {
        // Add unique identifiers to force re-renders
        setNewMessage({
          ...message, 
          timestamp: Date.now(),
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        });
      }
    };

    /**
     * Interface for read receipt data
     */
    interface IReadReceiptData {
      chatRoomId: string;
      userId: string;
      messageId?: string;
      timestamp?: number;
      [key: string]: any;
    }

    /**
     * Processes message read receipts
     * @param data - Read receipt information
     */
    const handleMessageRead = (data: IReadReceiptData): void => {
      if (data.chatRoomId === selectedChatRoomId) {
        console.log("Received read receipt:", data);
        // ! Important: Add unique ID to trigger state updates
        setNewMessage({
          ...data,
          type: "read_receipt",
          timestamp: data.timestamp || Date.now(),
          id: `read-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_see_message", handleMessageRead);

    // Cleanup listeners on unmount or when dependencies change
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_see_message", handleMessageRead);
    };
  }, [socket, selectedChatRoomId, userId]);

  // * Component lifecycle presence tracking
  useEffect(() => {
    if (!userId) return;
    
    console.log('Setting up component-level presence tracking');
    
    // Update last seen when component unmounts
    return () => {
      if (userId) {
        console.log('Component unmounting, updating last seen status');
        updateLastSeen(userId).catch(console.error);
      }
    };
  }, []); // Empty dependency array = run only on mount/unmount

  // * Render loading/auth states
  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || !userId) {
    return <div className="flex h-screen items-center justify-center">Please log in to access chat</div>;
  }

  // * Main component rendering
  return (
    <div className="flex h-screen">
      <Sidebar userId={userId} onChatSelect={setSelectedChatRoomId} />

      <div className="flex-1 flex flex-col">
        {selectedChatRoomId ? (
          <>
            <ChatHeader
              chatRoomId={selectedChatRoomId}
              socket={socket}
              userId={userId}
              onToggleMeetings={toggleMeetingsDisplay}
              upcomingMeetingsCount={upcomingMeetingsCount}
            />

            <div className="flex-1 overflow-auto">
              {showMeetings ? (
                <MeetingBox 
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  onClose={() => setShowMeetings(false)}
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
            
            {!showMeetings && (
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
