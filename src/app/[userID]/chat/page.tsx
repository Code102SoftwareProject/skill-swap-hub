'use client';
import React, { useState, useEffect } from "react";
import MessageList from "@/components/messageSystem/sideMessageList";
import ChatWindow from "@/components/messageSystem/chatWindow";

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string;
}

interface ChatRoom {
  _id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    sentAt: string;
    senderId: string;
  };
}

export default function ChatPage({ params }: { params: { userID: string } }) {
  const [userID, setUserID] = useState<string | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const { userID } = await params;
      setUserID(userID);

      // Fetch chat rooms for the user
      fetch(`http://localhost:3000/api/chatrooms?userId=${userID}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch chat rooms");
          }
          return response.json();
        })
        .then((data) => {
          setChatRooms(data.chatRooms || []); // Ensure chatRooms is always an array
        })
        .catch((error) => {
          console.error("Error fetching chat rooms:", error);
          setChatRooms([]); // Fallback to an empty array on error
        });
    };

    resolveParams();
  }, [params]);

  const handleSelectChat = (chatRoomId: string) => {
    setActiveChat(chatRoomId);
    setLoadingMessages(true);

    // Fetch messages for the selected chat room
    fetch(`http://localhost:3000/api/messages?chatRoomId=${chatRoomId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        return response.json();
      })
      .then((data) => {
        setMessages(data.messages || []); // Ensure messages is always an array
        setLoadingMessages(false);
      })
      .catch((error) => {
        console.error("Error fetching messages:", error);
        setMessages([]); // Fallback to an empty array on error
        setLoadingMessages(false);
      });
  };

  if (!userID) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Side Message List */}
      <MessageList
        chatRooms={chatRooms} // Pass valid array
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
      />

      {/* Chat Window */}
      <div className="flex-1 flex items-center justify-center">
        {activeChat ? (
          loadingMessages ? (
            <p className="text-gray-500">Loading messages...</p>
          ) : (
            <ChatWindow messages={messages} />
          )
        ) : (
          <p className="text-gray-500">Please select a chat to view details.</p>
        )}
      </div>
    </div>
  );
}
