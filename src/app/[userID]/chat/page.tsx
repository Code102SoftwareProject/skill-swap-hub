//app/[userID]/chat/page.tsx
'use client';
import React, { useState } from "react";
import MessageList from "@/components/messageSystem/sideMessageList";
import ChatWindow from "@/components/messageSystem/chatWindow";

interface Message {
  id: string;
  name: string;
  date: string;
}

const messagesData: Message[] = [
  { id: "1", name: "Joey Nil", date: "6:39 AM" },
  { id: "2", name: "Rodrigo Kalu", date: "8:15 PM" },
  { id: "3", name: "Gill Hub", date: "4:30 PM" },
];

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState<string>(messagesData[0].id);

  // This function is called when a chat is selected from the MessageList
  const handleSelectChat = (id: string) => {
    setActiveChat(id);  // Updates the active chat state
    // Here you can add:
    // 1. Fetch chat messages for the selected chat
    // 2. Update read status
    // 3. Load chat history
  };

  // Gets the details of selected chat to display in ChatWindow
  const activeChatDetails = messagesData.find((msg) => msg.id === activeChat);

  return (
    <div className="flex h-screen">
      {/* Side Message List */}
      <MessageList
        messages={messagesData}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
      />

      {/* Chat Window */}
      {activeChatDetails ? (
        <ChatWindow activeChatId={activeChatDetails.id} activeChatName={activeChatDetails.name} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Please select a chat to view details.</p>
        </div>
      )}
    </div>
  );
}
