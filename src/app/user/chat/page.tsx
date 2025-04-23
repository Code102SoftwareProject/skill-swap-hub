"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import { IMessage } from "@/types/types";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";
import { useAuth } from "@/lib/context/AuthContext";

export default function ChatPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const userId = user?._id; // Extract user ID from auth context

  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);

  // Handle selecting message for reply
  const handleReplySelect = (message: IMessage) => {
    setReplyingTo(message);
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const updateLastSeen = async (userId: string) => {
    if (!userId) return; // Skip if no user ID available
    
    try {
      console.log('Updating last seen for user:', userId);
      const response = await fetch('/api/onlinelog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Update last seen response:', data);

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    } catch (error) {
      console.error('Error updating online status:', error);
      throw error;
    }
  };

  //Create the Socket.IO connection on mount
  useEffect(() => {
    if (!userId || authLoading) return; // Don't connect if user isn't loaded yet
    
    // Initial online status update
    updateLastSeen(userId).catch(console.error);

    // const newSocket = io("https://valuable-iona-arlogic-b975dfc8.koyeb.app/", { transports: ["websocket"] });
    const newSocket = io("http://localhost:3001", { transports: ["websocket"] });
    setSocket(newSocket);

    // Cleanup function
    return () => {
      // Update last seen before disconnecting
      updateLastSeen(userId)
        .then(() => {
          newSocket.disconnect();
        })
        .catch(console.error);
    };
  }, [userId, authLoading]);

  // 2) As soon as the socket is ready, mark user as online
  useEffect(() => {
    if (!socket || !userId) return;
    socket.emit("presence_online", { userId });
  }, [socket, userId]);

  // Fetch chat participants when selecting a chat room
  useEffect(() => {
    if (!selectedChatRoomId) return;
    
    async function fetchChatRoom() {
      try {
        const response = await fetch(`/api/chat-rooms/${selectedChatRoomId}`);
        const data = await response.json();
        if (data.success && data.chatRoom) {
          setChatParticipants(data.chatRoom.participants || []);
        }
      } catch (error) {
        console.error("Error fetching chat room:", error);
      }
    }
    
    fetchChatRoom();
  }, [selectedChatRoomId]);

  // Improved socket listener for message read updates
  useEffect(() => {
    if (!socket || !selectedChatRoomId || !userId) return;

    socket.emit("join_room", {
      chatRoomId: selectedChatRoomId,
      userId,
    });

    // Listen for incoming messages
    interface IReceivedMessage {
      chatRoomId: string;
      [key: string]: any;
    }

    const handleReceiveMessage = (message: IReceivedMessage): void => {
      if (message.chatRoomId === selectedChatRoomId) {
        // Guarantee uniqueness with timestamp to force re-renders
        setNewMessage({
          ...message, 
          timestamp: Date.now(),
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        });
      }
    };

    // Handle read receipts more efficiently
    interface IReadReceiptData {
      chatRoomId: string;
      userId: string;
      messageId?: string;
      timestamp?: number;
      [key: string]: any;
    }

    const handleMessageRead = (data: IReadReceiptData): void => {
      if (data.chatRoomId === selectedChatRoomId) {
        console.log("Received read receipt:", data);
        // Guarantee uniqueness to force re-render
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

    // Cleanup function
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_see_message", handleMessageRead);
    };
  }, [socket, selectedChatRoomId, userId]);

  // 4) Render
  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || !userId) {
    return <div className="flex h-screen items-center justify-center">Please log in to access chat</div>;
  }

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
            />

            <div className="flex-1 overflow-auto">
              <MessageBox
                chatRoomId={selectedChatRoomId}
                userId={userId}
                socket={socket}
                newMessage={newMessage}
                onReplySelect={handleReplySelect}
              />
            </div>
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
