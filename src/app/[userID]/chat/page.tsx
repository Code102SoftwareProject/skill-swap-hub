"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/messageSystem/Sidebar";
import MessageBox from "@/components/messageSystem/MessageBox";

export default function ChatPage() {
  // Grab the [userId] from the URL: /[userId]/chat
  const { userId } = useParams() as { userId: string };
  
  // Keep track of which chat room is selected in the sidebar
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);

  // In case userId is not yet available, show a loader or fallback
  if (!userId) {
    return <div>Loading user...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* 1. Sidebar: fetches & shows chat rooms for this user, calls `setSelectedChatRoomId` */}
      <Sidebar
        userId={userId}
        onChatSelect={(chatRoomId) => setSelectedChatRoomId(chatRoomId)}
      />

      {/* 2. Main chat area: if user has clicked a chat, show MessageBox; else show placeholder */}
      <div className="flex-1 flex items-center justify-center">
        {selectedChatRoomId ? (
          <MessageBox userId={userId} chatRoomId={selectedChatRoomId} />
        ) : (
          <p>Select a chat room from the sidebar</p>
        )}
      </div>
    </div>
  );
}
