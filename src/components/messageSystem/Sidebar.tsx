"use client";

import { useEffect, useState, useCallback } from "react";
import { IChatRoom } from "@/types/chat";
import { Search } from "lucide-react";
import {
  fetchUserChatRooms,
  fetchUserProfile,
  fetchUnreadMessageCountsByRoom,
} from "@/services/chatApiServices";
import { preloadChatMessages } from "@/services/messagePreloader";
import {useSocket} from "@/lib/context/SocketContext";
import OptimizedAvatar from "@/components/ui/OptimizedAvatar";
import { getFirstLetter } from "@/utils/avatarUtils";
import { useBatchAvatarPreload } from "@/hooks/useOptimizedAvatar";
import PreloadStatus from "@/components/messageSystem/PreloadStatus";
import { decryptMessage } from "@/lib/messageEncryption/encryption";

interface SidebarProps {
  userId: string;
  selectedChatRoomId?: string | null;
  onChatSelect: (
    chatRoomId: string,
    participantInfo?: { id: string; name: string }
  ) => void;
  preloadProgress?: { loaded: number; total: number };
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

/**
 * Helper function to decrypt and format last message for display
 * @param {string} content - The message content (potentially encrypted)
 * @returns {string} - Formatted message for sidebar display
 */
function formatLastMessageForSidebar(content: string): string {
  if (!content) return "No messages yet";
  
  try {
    // Check if it's a file message
    if (content.startsWith('File:')) {
      const parts = content.split(':');
      const fileName = parts[1] || 'File';
      return `📎 ${fileName}`;
    }
    
    // Try to decrypt the message
    const decryptedContent = decryptMessage(content);
    
    // Truncate for sidebar display
    return decryptedContent.length > 30 
      ? decryptedContent.substring(0, 30) + "..." 
      : decryptedContent;
  } catch (error) {
    // If decryption fails, it might already be decrypted or corrupted
    console.warn("Failed to decrypt message in sidebar:", error);
    
    // Check if it looks like encrypted text (base64-like)
    if (content.length > 50 && /^[A-Za-z0-9+/=]+$/.test(content)) {
      return "Message..."; // Show generic text for encrypted content
    }
    
    // If it's short and doesn't look encrypted, show it directly
    return content.length > 30 
      ? content.substring(0, 30) + "..." 
      : content;
  }
}

function SidebarBox({ 
  otherParticipantName, 
  lastMessage, 
  isSelected,
  profile,
  userId,
  unreadCount = 0
}: { 
  otherParticipantName: string; 
  lastMessage: string;
  isSelected?: boolean;
  profile?: UserProfile;
  userId: string;
  unreadCount?: number;
}) {
  return (
    <div className="flex flex-row items-center space-x-2 p-1">
      {/* Optimized Avatar */}
      <OptimizedAvatar
        userId={userId}
        firstName={profile?.firstName}
        lastName={profile?.lastName}
        avatarUrl={profile?.avatar}
        size="small"
        className="flex-shrink-0"
        priority={false}
        lazy={true}
      />
      
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-heading text-sm md:text-base truncate">{otherParticipantName}</span>
        <span className={`font-body text-xs md:text-sm truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
          {lastMessage}
        </span>
      </div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <div className="flex-shrink-0 bg-primary text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar component 
 * @param {string} userId 
 * @param {function} onChatSelect 
 * @returns {TSX.Element} 
 */
export default function Sidebar({ userId, selectedChatRoomId, onChatSelect, preloadProgress }: SidebarProps) {
  const [chatRooms, setChatRooms] = useState<IChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{
    [key: string]: UserProfile;
  }>({});
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const {socket}= useSocket();
  const { preloadAvatars } = useBatchAvatarPreload();

  //* Component Specific Functions

  /**
   * Fetches unread message counts for all chat rooms
   * @async
   * @function fetchUnreadCounts
   * @returns {Promise<void>}
   */
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const unreadCountsData = await fetchUnreadMessageCountsByRoom(userId);
      setUnreadCounts(unreadCountsData);
    } catch (err) {
      console.error("Error fetching unread counts:", err);
    }
  }, [userId]);

  /**
   * Fetches all chat rooms for the current user from the API
   * @async
   * @function fetchChatRooms
   * @returns {Promise<void>}
   */
  const fetchChatRooms = useCallback(async () => {
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
  }, [userId]);

  /**
   * Fetches profile information for all unique users in the chat rooms
   *
   * @async
   * @function fetchUserProfiles
   * @returns {Promise<void>}
   */
  const fetchUserProfilesSimple = useCallback(async () => {
    // Extract unique participant IDs except me
    const uniqueUserIds = new Set<string>();
    chatRooms.forEach((chat) => {
      chat.participants.forEach((participantId) => {
        if (participantId !== userId) {
          uniqueUserIds.add(participantId);
        }
      });
    });

    if (uniqueUserIds.size === 0) return;

    console.log(`Fetching profiles for ${uniqueUserIds.size} users`);

    // Prepare data for batch avatar preloading
    const avatarData: Array<{
      userId: string;
      firstName?: string;
      avatarUrl?: string;
    }> = [];

    // Fetch each profile individually
    for (const id of uniqueUserIds) {
      try {
        const userData = await fetchUserProfile(id);

        if (userData) {
          console.log(`Profile fetched for user ${id}:`, userData);
          setUserProfiles((prev) => ({
            ...prev,
            [id]: userData,
          }));

          // Add to avatar preload data
          avatarData.push({
            userId: id,
            firstName: userData.firstName,
            avatarUrl: userData.avatar
          });
        } else {
          console.log(`No profile found for user ${id}, setting fallback`);
          setUserProfiles((prev) => ({
            ...prev,
            [id]: {
              firstName: "Unknown",
              lastName: "User",
            },
          }));
        }
      } catch (err) {
        console.error(`Error fetching profile for user ${id}:`, err);
        setUserProfiles((prev) => ({
          ...prev,
          [id]: {
            firstName: "Unknown",
            lastName: "User",
          },
        }));
      }
    }

    // Batch preload avatars for better performance
    if (avatarData.length > 0) {
      try {
        await preloadAvatars(avatarData, 'small');
        console.log(`Preloaded ${avatarData.length} avatars`);
      } catch (error) {
        console.warn('Avatar preloading failed:', error);
      }
    }
  }, [chatRooms, userId, preloadAvatars]);

  /**
   * Effect hook that triggers chat room data fetching when component mounts
   * or when the userId dependency changes
   *
   * @dependency [userId, fetchChatRooms, fetchUnreadCounts]
   */
  useEffect(() => {
    if (userId) {
      fetchChatRooms();
      fetchUnreadCounts();
    }
  }, [userId, fetchChatRooms, fetchUnreadCounts]);

  /**
   * Effect hook that fetches user profile data whenever the chat rooms list changes
   * Ensures we have profile information for all participants in the conversations
   *
   * @dependency [fetchUserProfilesSimple, chatRooms.length]
   */
  useEffect(() => {
    if (chatRooms.length > 0) {
      fetchUserProfilesSimple();
    }
  }, [fetchUserProfilesSimple, chatRooms.length]);

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
          // If room not exists
          setTimeout(() => fetchChatRooms(), 0);
          return prevRooms;
        }
        
        // Update the existing room with new message
        return prevRooms.map(room => {
          if (room._id === messageData.chatRoomId) {
            return {
              ...room,
              lastMessage: {
                content: messageData.content, // Keep encrypted content, will be decrypted in display
                senderId: messageData.senderId,
                sentAt: new Date().getTime()
              }
            };
          }
          return room;
        });
      });

      // Update unread counts if the message is not from current user
      if (messageData.senderId !== userId) {
        setUnreadCounts(prevCounts => ({
          ...prevCounts,
          [messageData.chatRoomId]: (prevCounts[messageData.chatRoomId] || 0) + 1
        }));
      }
    };

    // Set up the listener
    socket.on("receive_message", handleReceiveMessage);

    // Clean up
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, userId, fetchChatRooms]);

  /**
   * Effect hook that clears unread count when a chat room is selected
   * 
   * @dependency [selectedChatRoomId]
   */
  useEffect(() => {
    if (selectedChatRoomId && unreadCounts[selectedChatRoomId] > 0) {
      setUnreadCounts(prevCounts => ({
        ...prevCounts,
        [selectedChatRoomId]: 0
      }));
    }
  }, [selectedChatRoomId, unreadCounts]);

  /**
   * Renders a loading state while fetching initial data
   */
  if (loading) {
    return (
      <div className="w-full md:w-64 bg-grayfill border-solid border-gray-900 text-white p-2 md:p-4">
        <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-4">Messages</h2>
        <p className="text-sm">Loading chats...</p>
      </div>
    );
  }

  /**
   * Shows all chatrooms with search box
   */
  return (
    <div className="w-full md:w-64 bg-bgcolor text-white h-screen p-2 md:p-4 border-solid border-r border-gray-600 flex-shrink-0">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold text-textcolor font-body">Messages</h2>
        {/* Discrete loading indicator */}
        {preloadProgress && preloadProgress.total > 0 && preloadProgress.loaded < preloadProgress.total && (
          <div className="flex items-center space-x-1">
            <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
            <span className="text-xs text-gray-400">{preloadProgress.loaded}/{preloadProgress.total}</span>
          </div>
        )}
      </div>
      
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
            // ! 2 Participants in chat
            const otherParticipantId =
              chat.participants.find((id) => id !== userId) || "";
            const profile = userProfiles[otherParticipantId];

            // Show all rooms when no search query is provided
            if (!profile || !searchQuery.trim()) return true;

            // Filter by name match case insensitive 
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

            // ! Last Message - decrypt and format for display
            const lastMessage = chat.lastMessage?.content 
              ? formatLastMessageForSidebar(chat.lastMessage.content)
              : "No messages yet";

            return (
              /*
                ! Selected Chatroom 
              */
              <li
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
                  profile={profile}
                  userId={otherParticipantId}
                  unreadCount={unreadCounts[chat._id] || 0}
                />
              </li>
            );
          })}
      </ul>
    </div>
  );
}