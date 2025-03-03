"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";

export default function ChatPage() {
  const { userId } = useParams() as { userId: string };//url data extract userId

  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  // Real-time new message that we pass to <MessageBox />
  const [newMessage, setNewMessage] = useState<any>(null);

  //Create the Socket.IO connection on mount
  useEffect(() => {
    const newSocket = io("http://localhost:3001", { transports: ["websocket"] });
    setSocket(newSocket);

    // Cleanup function to disconnect the socket on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);//will run only once

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
              />
            </div>

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
