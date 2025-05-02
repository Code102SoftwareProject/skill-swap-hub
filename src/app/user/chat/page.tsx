"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import { IMessage } from "@/types/chat";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";
import MeetingBox from "@/components/messageSystem/MeetingBox";
import { useAuth } from "@/lib/context/AuthContext";
import { updateLastSeen, fetchChatRoom } from "@/services/chatApiServices";

export default function ChatPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const userId = user?._id;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [selectedParticipantInfo, setSelectedParticipantInfo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);
  const [showMeetings, setShowMeetings] = useState<boolean>(false);

  const handleReplySelect = (message: IMessage) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const toggleMeetingsDisplay = (show: boolean) => {
    setShowMeetings(show);
  };

  const handleChatSelect = (chatRoomId: string, participantInfo?: any) => {
    setSelectedChatRoomId(chatRoomId);
    setNewMessage(null); // Reset new message state when changing chats
    if (participantInfo) {
      setSelectedParticipantInfo(participantInfo);
    }
  };

  useEffect(() => {
    if (!userId || authLoading) return;

    updateLastSeen(userId).catch(console.error);

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET, { transports: ["websocket"] });
    setSocket(newSocket);

    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/onlinelog', JSON.stringify({ userId }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      updateLastSeen(userId)
        .then(() => {
          newSocket.disconnect();
        })
        .catch(console.error);
    };
  }, [userId, authLoading]);

  useEffect(() => {
    if (!socket || !userId) return;
    socket.emit("presence_online", { userId });
  }, [socket, userId]);

  useEffect(() => {
    if (!selectedChatRoomId) return;

    async function getChatRoomParticipants() {
      const chatRoom = await fetchChatRoom(selectedChatRoomId as string);
      if (chatRoom) {
        setChatParticipants(chatRoom.participants || []);
      }
    }

    getChatRoomParticipants();
    setShowMeetings(false);
  }, [selectedChatRoomId, userId]);

  useEffect(() => {
    if (!socket || !selectedChatRoomId || !userId) return;

    socket.emit("join_room", {
      chatRoomId: selectedChatRoomId,
      userId,
    });

    interface IReceivedMessage {
      chatRoomId: string;
      [key: string]: any;
    }

    const handleReceiveMessage = (message: IReceivedMessage): void => {
      if (message.chatRoomId === selectedChatRoomId) {
        setNewMessage({
          ...message,
          timestamp: Date.now(),
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, selectedChatRoomId, userId]);

  useEffect(() => {
    if (!userId) return;

    console.log('Setting up component-level presence tracking');

    return () => {
      if (userId) {
        console.log('Component unmounting, updating last seen status');
        updateLastSeen(userId).catch(console.error);
      }
    };
  }, []);

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || !userId) {
    return <div className="flex h-screen items-center justify-center">Please log in to access chat</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar userId={userId} onChatSelect={handleChatSelect} />

      <div className="flex-1 flex flex-col">
        {selectedChatRoomId ? (
          <>
            <ChatHeader
              chatRoomId={selectedChatRoomId}
              socket={socket}
              userId={userId}
              onToggleMeetings={toggleMeetingsDisplay}
              upcomingMeetingsCount={0}
              initialParticipantInfo={selectedParticipantInfo}
            />

            <div className="flex-1 overflow-auto">
              {showMeetings ? (
                <MeetingBox
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  onClose={() => setShowMeetings(false)}
                />
              ) : (
                <MessageBox
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  socket={socket}
                  newMessage={newMessage}
                  onReplySelect={handleReplySelect}
                />
              )}
            </div>

            {!showMeetings && (
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
            )}
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
