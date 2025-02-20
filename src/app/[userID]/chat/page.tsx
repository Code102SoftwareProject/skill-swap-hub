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

  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);

  // Real-time new message that we pass to <MessageBox />
  const [newMessage, setNewMessage] = useState<any>(null);

  // 1) Create the Socket.IO connection on mount
  useEffect(() => {
    const newSocket = io("http://localhost:3001", { transports: ["websocket"] });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2) Join the selected room, listen for "receive_message"
  useEffect(() => {
    if (!socket || !selectedChatRoomId) return;

    socket.emit("join_room", {
      chatRoomId: selectedChatRoomId,
      userId,
    });

    socket.on("receive_message", (message) => {
      // Only set if the incoming message is for our current room
      if (message.chatRoomId === selectedChatRoomId) {
        setNewMessage(message);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket, selectedChatRoomId, userId]);

  // 3) Render the layout
  return (
    <div className="flex h-screen">
      <Sidebar userId={userId} onChatSelect={setSelectedChatRoomId} />

      <div className="flex-1 flex flex-col">
        {selectedChatRoomId ? (
          <>
            <ChatHeader
              chatRoomId={selectedChatRoomId}
              socket={socket}
              otherUserId="67a6ff03cb5c199b45918b92" // or whomever you're chatting with
            />

            <div className="flex-1 overflow-auto">
              <MessageBox
                chatRoomId={selectedChatRoomId}
                userId={userId}
                socket={socket}
                newMessage={newMessage}
              />
            </div>

            <div className="border-t p-2 bg-white">
              {/* pass in the receiverId if your UI knows it */}
              <MessageInput
                socket={socket}
                chatRoomId={selectedChatRoomId}
                senderId={userId}
                receiverId="67a6ff03cb5c199b45918b92"
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
