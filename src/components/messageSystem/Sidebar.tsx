"use client";

import { useEffect, useState } from "react";
import { IChatRoom } from "@/types/chat";
import { User, Search, X } from "lucide-react";
import {
  fetchUserChatRooms,
  fetchUserProfile,
} from "@/services/chatApiServices";
import {useSocket} from "@/lib/context/SocketContext";

interface SidebarProps {
  userId: string;
  selectedChatRoomId?: string | null;
  onChatSelect: (
    chatRoomId: string,
    participantInfo?: { id: string; name: string }
  ) => void;
  onCloseMobile?: () => void;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

function SidebarBox({ 
  otherParticipantName, 
  lastMessage, 
  isSelected 
}: { 
  otherParticipantName: string; 
  lastMessage: string;
  isSelected?: boolean;
}) {
  return (
    <div className="flex flex-row items-center space-x-2">
      <User className="text-lg sm:text-xl md:text-2xl flex-shrink-0" />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-heading truncate text-sm sm:text-base">{otherParticipantName}</span>
        <span className={`font-body text-xs sm:text-sm truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
          {lastMessage}
        </span>
      </div>
    </div>
  );
}

export default function Sidebar({ userId, selectedChatRoomId, onChatSelect, onCloseMobile }: SidebarProps) {
  const [chatRooms, setChatRooms] = useState<IChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{
    [key: string]: UserProfile;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const {socket}= useSocket();

  async function fetchChatRooms() {
    try {
      setLoading(true);
      const chatRoomsData = await fetchUserChatRooms(userId);
      if (chatRoomsData) {
        setChatRooms(chatRoomsData);
      }
    } catch (err) {
      console.error("Error fetching chat rooms:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfiles() {
    const uniqueUserIds = new Set<string>();
    chatRooms.forEach((chat) => {
      chat.participants.forEach((participantId) => {
        if (participantId !== userId) {
          uniqueUserIds.add(participantId);
        }
      });
    });

    for (const id of uniqueUserIds) {
      try {
        const userData = await fetchUserProfile(id);

        if (userData) {
          setUserProfiles((prev) => ({
            ...prev,
            [id]: userData,
          }));
        } else {
          setUserProfiles((prev) => ({
            ...prev,
            [id]: {
              firstName: "Unknown",
              lastName: "User",
            },
          }));
        }
      } catch (err) {
        console.error("Error in fetch user profile");
      }
    }
  }

  useEffect(() => {
    if (userId) {
      fetchChatRooms();
    }
  }, [userId]);

  useEffect(() => {
    if (chatRooms.length > 0) {
      fetchUserProfiles();
    }
  }, [chatRooms, userId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (messageData: any) => {
      setChatRooms(prevRooms => {
        const roomExists = prevRooms.some(room => room._id === messageData.chatRoomId);
        
        if (!roomExists) {
          setTimeout(() => fetchChatRooms(), 0);
          return prevRooms;
        }
        
        return prevRooms.map(room => {
          if (room._id === messageData.chatRoomId) {
            return {
              ...room,
              lastMessage: {
                content: messageData.content,
                senderId: messageData.senderId,
                sentAt: new Date().getTime()
              }
            };
          }
          return room;
        });
      });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, userId, fetchChatRooms]);

  if (loading) {
    return (
      <div className="w-full sm:w-64 md:w-64 max-w-sm bg-grayfill border-solid border-gray-900 text-white p-3 sm:p-4 h-full">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Messages</h2>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="md:hidden text-white p-1"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
        <p className="text-sm sm:text-base">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-64 md:w-64 max-w-sm bg-bgcolor text-white h-full p-3 sm:p-4 border-solid border-r border-gray-600 flex flex-col">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-textcolor font-body">Messages</h2>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="md:hidden text-textcolor p-1 hover:text-white"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
      
      {/* Search bar */}
      <div className="mb-3 sm:mb-4 relative bg-primary flex-shrink-0">
        <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
          <Search className="text-bgcolor w-3 h-3 sm:w-4 sm:h-4" />
        </div>
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full pl-6 sm:pl-8 pr-2 py-1.5 sm:py-2 bg-primary text-bgcolor rounded focus:outline-none focus:ring-1 focus:ring-primary font-body text-xs sm:text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1 sm:space-y-2">
          {chatRooms
            .sort((a, b) => {
              const dateA = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt) : new Date(0);
              const dateB = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt) : new Date(0);
              return dateB.getTime() - dateA.getTime();
            })
            .filter((chat) => {
              const otherParticipantId =
                chat.participants.find((id) => id !== userId) || "";
              const profile = userProfiles[otherParticipantId];

              if (!profile || !searchQuery.trim()) return true;

              const fullName =
                `${profile.firstName} ${profile.lastName}`.toLowerCase();
              return fullName.includes(searchQuery.toLowerCase());
            })
            .map((chat) => {
              const otherParticipantId =
                chat.participants.find((id) => id !== userId) || "";

              const profile = userProfiles[otherParticipantId];

              const otherParticipantName = profile
                ? `${profile.firstName} ${profile.lastName}`
                : otherParticipantId.substring(0, 8);

              const lastMessage = chat.lastMessage?.content.substring(0,20) || "No messages yet";

              return (
                <li
                  key={chat._id}
                  className={`p-2 sm:p-3 bg-bgcolor hover:bg-sky-200 cursor-pointer text-textcolor border-solid border-t border-gray-600 rounded transition-colors ${
                    selectedChatRoomId === chat._id ? "bg-sky-600 border-sky-700 text-white" : ""
                  }`}
                  onClick={() =>
                    onChatSelect(chat._id, {
                      id: otherParticipantId,
                      name: otherParticipantName,
                    })
                  }
                >
                  <SidebarBox
                    otherParticipantName={otherParticipantName}
                    lastMessage={lastMessage}
                    isSelected={selectedChatRoomId === chat._id}
                  />
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}
