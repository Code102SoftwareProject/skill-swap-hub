"use client";

import { useEffect, useState } from "react";
import { IChatRoom } from "@/types/chat";
import { User, Search } from "lucide-react";
import {
  fetchUserChatRooms,
  fetchUserProfile,
} from "@/services/chatApiServices";
import {useSocket} from "@/lib/context/SocketContext";

interface SidebarProps {
  userId: string;
  selectedChatRoomId?: string | null; // Add this prop
  onChatSelect: (
    chatRoomId: string,
    participantInfo?: { id: string; name: string }
  ) => void;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string; // TODO:Make it display Profile Pic
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
    <div className="flex flex-row items-center space-x-2 p-1">
      <User className="text-lg md:text-2xl flex-shrink-0" />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-heading text-sm md:text-base truncate">{otherParticipantName}</span>
        <span className={`font-body text-xs md:text-sm truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
          {lastMessage}
        </span>
      </div>
    </div>
  );
}
/**
 * Sidebar component 
 * @param {string} userId 
 * @param {function} onChatSelect 
 * @returns {TSX.Element} 
 */
export default function Sidebar({ userId, selectedChatRoomId, onChatSelect }: SidebarProps) {
  const [chatRooms, setChatRooms] = useState<IChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{
    [key: string]: UserProfile;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const {socket}= useSocket();

  //* Component Specific Functions

  /**
   * Fetches all chat rooms for the current user from the API
   * @async
   * @function fetchChatRooms
   * @returns {Promise<void>}
   */
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

  /**
   * Fetches profile information for all unique users in the chat rooms
   *
   * @async
   * @function fetchUserProfiles
   * @returns {Promise<void>}
   */
  async function fetchUserProfiles() {
    // Extract unique participant IDs excepts Me
    const uniqueUserIds = new Set<string>();
    chatRooms.forEach((chat) => {
      chat.participants.forEach((participantId) => {
        if (participantId !== userId) {
          uniqueUserIds.add(participantId);
        }
      });
    });

    // Fetch profile data for each unique user
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

  /**
   * Effect hook that triggers chat room data fetching when component mounts
   * or when the userId dependency changes
   *
   * @dependency [userId]
   */
  useEffect(() => {
    if (userId) {
      fetchChatRooms();
    }
  }, [userId]);

  /**
   * Effect hook that fetches user profile data whenever the chat rooms list changes
   * Ensures we have profile information for all participants in the conversations
   *
   * @dependency [chatRooms, userId]
   */
  useEffect(() => {
    if (chatRooms.length > 0) {
      fetchUserProfiles();
    }
  }, [chatRooms, userId]);

  /**
   * Effect hook that listens for new messages and updates the sidebar
   * 
   * @dependency [socket, userId, fetchChatRooms]
   */
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (messageData: any) => {
      setChatRooms(prevRooms => {
        // Check if this room exists in our list
        const roomExists = prevRooms.some(room => room._id === messageData.chatRoomId);
        
        if (!roomExists) {
          // If room not exisits
          setTimeout(() => fetchChatRooms(), 0);
          return prevRooms;
        }
        
        // Update the existing room with new message
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

    // Set up the listener
    socket.on("receive_message", handleReceiveMessage);

    // Clean up
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, userId, fetchChatRooms]);

  /**
   * * Renders a loading state while fetching initial data
   */  if (loading) {
    return (
      <div className="w-full md:w-64 bg-grayfill border-solid border-gray-900 text-white p-2 md:p-4">
        <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-4">Messages</h2>
        <p className="text-sm">Loading chats...</p>
      </div>
    );
  }
  /**
   * * Shows all chatrooms with seqrch box
   */  return (
    <div className="w-full md:w-64 bg-bgcolor text-white h-screen p-2 md:p-4 border-solid border-r border-gray-600 flex-shrink-0">
      <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-4 text-textcolor font-body">Messages</h2>
      
      {/* Search bar */}
      <div className="mb-2 md:mb-4 relative bg-primary">
        <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
          <Search className="text-bgcolor w-4 h-4 md:w-5 md:h-5" />
        </div>
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full pl-6 md:pl-8 pr-2 py-1 md:py-2 bg-primary text-bgcolor rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary font-body"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ul className="space-y-1 md:space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
        {chatRooms
          // Sort by most recent message
          .sort((a, b) => {
            const dateA = a.lastMessage?.sentAt ? new Date(a.lastMessage.sentAt) : new Date(0);
            const dateB = b.lastMessage?.sentAt ? new Date(b.lastMessage.sentAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          })
          // Filter chat rooms based on search query
          .filter((chat) => {
            // ! 2 Paticipants  in chat
            const otherParticipantId =
              chat.participants.find((id) => id !== userId) || "";
            const profile = userProfiles[otherParticipantId];

            // Show all rooms when no search query is provided
            if (!profile || !searchQuery.trim()) return true;

            // Filter by name match case insesitve 
            const fullName =
              `${profile.firstName} ${profile.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
          })
          .map((chat) => {
            // Find the other participant in the conversation
            const otherParticipantId =
              chat.participants.find((id) => id !== userId) || "";

            const profile = userProfiles[otherParticipantId];

            // Format display name with fallback to ID substring
            const otherParticipantName = profile
              ? `${profile.firstName} ${profile.lastName}`
              : otherParticipantId.substring(0, 8);

            // ! Last Message 
            const lastMessage = chat.lastMessage?.content.substring(0,6) || "No messages yet";

            return (
              /*
                ! Selected Chatroom 
              */              <li
                key={chat._id}
                className={`p-1 md:p-2 bg-bgcolor hover:bg-sky-200 cursor-pointer text-textcolor border-solid border-t border-gray-600 ${
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
  );
}
