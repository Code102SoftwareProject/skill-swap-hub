"use client";

import { io } from "socket.io-client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/messageSystem/Sidebar";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";

const socket = io("http://localhost:3001");

export default function ChatPage() {
  const { userId } = useParams() as { userId: string };
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedChatRoomId) return;

    // ✅ Remove previous event listeners to prevent duplicates
    socket.off("receive_message");

    // ✅ Listen for incoming messages
    socket.on("receive_message", (message) => {
      console.log("📩 Received message:", message);
      setNewMessage(message); // Ensure only one update
    });

    return () => {
      socket.off("receive_message"); // ✅ Cleanup on component unmount
    };
  }, [selectedChatRoomId]);

  useEffect(() => {
    socket.emit("client_ready", "Hello from the client!");

    const fetchChatDetails = async () => {
      if (!selectedChatRoomId) return;
      setIsLoading(true);

      try {
        const response = await fetch(`/api/chatrooms?userId=${userId}`);
        const data = await response.json();

        if (data.success && data.chatRooms.length > 0) {
          const chatRoom = data.chatRooms.find((room: { _id: string }) => room._id === selectedChatRoomId);
          if (chatRoom) {
            const otherUserId = chatRoom.participants.find((id: string) => id !== userId);
            setReceiverId(otherUserId || null);
          } else {
            setReceiverId(null);
          }
        } else {
          setReceiverId(null);
        }
      } catch (error) {
        setReceiverId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatDetails();
  }, [selectedChatRoomId, userId]);

  if (!userId) {
    return <div>Loading user...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar userId={userId} onChatSelect={(chatRoomId) => setSelectedChatRoomId(chatRoomId)} />

      <div className="flex-1 flex flex-col">
        {selectedChatRoomId ? (
          <>
            <div className="flex-1 overflow-auto">
              <MessageBox userId={userId} chatRoomId={selectedChatRoomId} newMessage={newMessage} />
            </div>

            <div className="border-t p-2 bg-white">
              {isLoading ? (
                <p className="text-gray-500">Loading chat details...</p>
              ) : (
                <MessageInput
                  chatRoomId={selectedChatRoomId}
                  senderId={userId}
                  receiverId={receiverId || "unknown"}
                  onMessageSent={(msg) => {
                    setNewMessage(msg);
                    socket.emit("send_message", msg); // Emit message via socket
                  }}
                />
              )}
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
