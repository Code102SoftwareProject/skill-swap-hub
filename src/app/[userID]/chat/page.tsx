//app/[userId]/chat/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";

export default function ChatPage() {
  const { userId } = useParams() as { userId: string };

  // 1) Socket
  const [socket, setSocket] = useState<Socket | null>(null);

  // 2) Selected Chat Room
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(
    null
  );

  // 3) Real-time new message from server
  const [newMessage, setNewMessage] = useState<any>(null);

  // 4) Track who’s online
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // 5) Track who’s typing in the current room
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>(
    {}
  );

  // --------------------------------------------------
  // A) Initialize Socket and handle global events
  // --------------------------------------------------
  useEffect(() => {
    const newSocket = io("http://localhost:3001", {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // --------------------------------------------------
  // B) Listen for user_online, user_offline, etc.
  // --------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    // When a user comes online
    socket.on("user_online", ({ userId }) => {
      setOnlineUsers((prev) => {
        if (prev.includes(userId)) return prev; // Already there
        return [...prev, userId];
      });
    });

    // When a user goes offline
    socket.on("user_offline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Someone is typing in the current room
    socket.on("user_typing", ({ userId }) => {
      // Mark them as typing
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: true,
      }));
    });

    // Someone stopped typing
    socket.on("user_stopped_typing", ({ userId }) => {
      setTypingUsers((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    });

    return () => {
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
    };
  }, [socket]);

  // --------------------------------------------------
  // C) Join a room and listen for messages
  // --------------------------------------------------
  useEffect(() => {
    if (!socket || !selectedChatRoomId) return;

    // Join the selected chat room
    socket.emit("join_room", {
      chatRoomId: selectedChatRoomId,
      userId,
    });

    // Listen for new messages in *any* room
    socket.on("receive_message", (message) => {
      // If it's for our current room, set newMessage
      if (message.chatRoomId === selectedChatRoomId) {
        setNewMessage(message);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket, selectedChatRoomId, userId]);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="flex h-screen">
      {/* Sidebar -> pass userId and 
          also pass onlineUsers if you want to show a green dot next to each user */}
      <Sidebar
        userId={userId}
        onChatSelect={setSelectedChatRoomId}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {selectedChatRoomId ? (
          <>
            {/* OPTIONAL: Show chat header with room info, 
                pass the chatRoomId and any other state */}
            <ChatHeader chatRoomId={selectedChatRoomId} />

            {/* The messages box */}
            <div className="flex-1 overflow-auto">
              <MessageBox
                chatRoomId={selectedChatRoomId}
                userId={userId}
                socket={socket}
                newMessage={newMessage}
                typingUsers={typingUsers} // optional if you want to show "X is typing"
              />
            </div>

            {/* The message input (handles sending & typing) */}
            <div className="border-t p-2 bg-white">
              <MessageInput
                socket={socket}
                chatRoomId={selectedChatRoomId}
                senderId={userId}
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
