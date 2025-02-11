"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/messageSystem/Sidebar";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";

export default function ChatPage() {
  const { userId } = useParams() as { userId: string };
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!selectedChatRoomId) return;
      setIsLoading(true);

      try {
        const response = await fetch(`/api/chatrooms?userId=${userId}`);
        const data = await response.json();

        if (data.success && data.chatRooms.length > 0) {
          // Find the chat room the user is in
          const chatRoom = data.chatRooms.find(room => room._id === selectedChatRoomId);

          if (chatRoom) {
            // Find the other participant in the chat
            const otherUserId = chatRoom.participants.find((id: string) => id !== userId);
            setReceiverId(otherUserId || null);
            console.log("✅ Receiver ID set:", otherUserId);
          } else {
            console.warn("⚠️ Warning: Chat room not found.");
            setReceiverId(null);
          }
        } else {
          console.error("❌ Error: No chat rooms found.");
          setReceiverId(null);
        }
      } catch (error) {
        console.error("❌ Network error fetching chat room details:", error);
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

            {/* ✅ Fix: Ensure message input always shows, even if receiverId is null */}
            <div className="border-t p-2 bg-white">
              {isLoading ? (
                <p className="text-gray-500">Loading chat details...</p>
              ) : (
                <MessageInput
                  chatRoomId={selectedChatRoomId}
                  senderId={userId}
                  receiverId={receiverId || "unknown"} // Ensure input is always shown
                  onMessageSent={setNewMessage}
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
