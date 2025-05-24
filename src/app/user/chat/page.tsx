"use client";

import React, { useState, useEffect } from "react";
import { IMessage } from "@/types/chat";

import Sidebar from "@/components/messageSystem/Sidebar";
import ChatHeader from "@/components/messageSystem/ChatHeader";
import MessageBox from "@/components/messageSystem/MessageBox";
import MessageInput from "@/components/messageSystem/MessageInput";
import MeetingBox from "@/components/messageSystem/MeetingBox";
import SessionBox from "@/components/messageSystem/SessionBox";
import { useAuth } from "@/lib/context/AuthContext";
import { useSocket } from "@/lib/context/SocketContext";
import { fetchChatRoom } from "@/services/chatApiServices";

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?._id;

  const { socket, joinRoom, sendMessage, startTyping, stopTyping} = useSocket();
  
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [selectedParticipantInfo, setSelectedParticipantInfo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);
  
  const [showMeetings, setShowMeetings] = useState<boolean>(false);
  const [showSessions, setShowSessions] = useState<boolean>(false);
  // Add mobile sidebar toggle state
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  const handleReplySelect = (message: IMessage) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const toggleMeetingsDisplay = (show: boolean) => {
    setShowMeetings(show);
  };

  const toggleSessionsDisplay = (show: boolean) => {
    setShowSessions(show);
    if (show) setShowMeetings(false);
  };

  const handleChatSelect = (chatRoomId: string, participantInfo?: any) => {
    setSelectedChatRoomId(chatRoomId);
    setNewMessage(null);
    if (participantInfo) {
      setSelectedParticipantInfo(participantInfo);
    }
    // Hide sidebar on mobile after selecting a chat
    setShowSidebar(false);
  };

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
    setShowSessions(false);
  }, [selectedChatRoomId, userId]);

  useEffect(() => {
    if (!socket || !selectedChatRoomId || !userId) return;

    joinRoom(selectedChatRoomId);

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
  }, [socket, selectedChatRoomId, userId, joinRoom]);

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center text-sm sm:text-base">Loading...</div>;
  }

  if (!user || !userId) {
    return <div className="flex h-screen items-center justify-center text-sm sm:text-base px-4 text-center">Please log in to access chat</div>;
  }

  return (
    <div className="flex h-screen relative">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar - responsive positioning */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 
        fixed md:static 
        z-50 md:z-auto 
        transition-transform duration-300 ease-in-out
        h-full
      `}>
        <Sidebar 
          userId={userId} 
          selectedChatRoomId={selectedChatRoomId} 
          onChatSelect={handleChatSelect}
          onCloseMobile={() => setShowSidebar(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {selectedChatRoomId ? (
          <>
            <ChatHeader
              chatRoomId={selectedChatRoomId}
              userId={userId}
              onToggleMeetings={toggleMeetingsDisplay}
              onToggleSessions={toggleSessionsDisplay}
              initialParticipantInfo={selectedParticipantInfo}
              showingSessions={showSessions}
              showingMeetings={showMeetings}
              onToggleSidebar={() => setShowSidebar(!showSidebar)}
            />

            <div className="flex-1 overflow-auto min-h-0">
              {showMeetings ? (
                <MeetingBox
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  onClose={() => setShowMeetings(false)}
                />
              ) : showSessions ? (
                <SessionBox />
              ) : (
                <MessageBox
                  chatRoomId={selectedChatRoomId}
                  userId={userId}
                  newMessage={newMessage}
                  onReplySelect={handleReplySelect}
                  participantInfo={selectedParticipantInfo}
                />
              )}
            </div>

            {!showMeetings && !showSessions && (
              <div className="border-t bg-white flex-shrink-0">
                <MessageInput
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
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <p className="text-center mb-4 text-sm sm:text-base">Select a chat room to start messaging</p>
            <button 
              className="md:hidden bg-primary text-white px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base"
              onClick={() => setShowSidebar(true)}
            >
              Show Conversations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}