"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import { IMessage } from "@/types/types";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";

export default function ChatPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);

  // Handle selecting message for reply
  const handleReplySelect = (message: IMessage) => {
    setReplyingTo(message);
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const updateLastSeen = async (userId: string) => {
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
    // Initial online status update
    updateLastSeen(userId).catch(console.error);

    const newSocket = io("https://valuable-iona-arlogic-b975dfc8.koyeb.app/", { transports: ["websocket"] });
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
  }, [userId]);

  // 2) As soon as the socket is ready, mark user as online
  useEffect(() => {
    if (!socket) return;
    socket.emit("presence_online", { userId });
  }, [socket, userId]);

  // 3) Join the selected room, listen for "receive_message"
  useEffect(() => {
    if (!socket || !selectedChatRoomId) return;

    socket.emit("join_room", {
      chatRoomId: selectedChatRoomId,
      userId,
    });

    // Listen for incoming messages
    socket.on("receive_message", (message) => {
      if (message.chatRoomId === selectedChatRoomId) {
        setNewMessage(message);
      }
    });

    // Cleanup function to remove the listener
    return () => {
      socket.off("receive_message");
    };
  }, [socket, selectedChatRoomId, userId]);

  // 4) Render
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
