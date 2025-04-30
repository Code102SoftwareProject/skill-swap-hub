"use client";

import { useEffect, useState } from "react";
import { IChatRoom } from "@/types/chat";
import { BsPerson } from 'react-icons/bs'
import { BsSearch } from 'react-icons/bs'
import { decryptMessage } from "@/lib/messageEncryption/encryption";

interface SidebarProps {
  userId: string;
  onChatSelect: (chatRoomId: string) => void;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

/**
 * Sidebar component that displays the user's chat rooms and allows for searching and selecting conversations
 * 
 * @param {string} userId - The ID of the current authenticated user
 * @param {function} onChatSelect - Callback function that's triggered when a chat room is selected
 * @returns {JSX.Element} The rendered sidebar component with chat list and search functionality
 */
export default function Sidebar({ userId, onChatSelect }: SidebarProps) {
  const [chatRooms, setChatRooms] = useState<IChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: UserProfile}>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    /**
     * Fetches all chat rooms for the current user from the API
     * 
     * @async
     * @returns {Promise<void>} 
     * @sideEffect Updates chatRooms state with the retrieved data
     * @sideEffect Updates loading state when operation completes
     */
    async function fetchChatRooms() {
      try {
        setLoading(true);
        const res = await fetch(`/api/chatrooms?userId=${userId}`);
        const data = await res.json();
        console.log('Chat rooms response:', data); // Debug log
        if (data.success) {
          setChatRooms(data.chatRooms);
        }
      } catch (err) {
        console.error('Error fetching chat rooms:', err); // Add error logging
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchChatRooms();
    }
  }, [userId]);

  useEffect(() => {
    /**
     * Fetches user profile data for all chat participants (except current user)
     * 
     * @async
     * @returns {Promise<void>}
     * @sideEffect Updates userProfiles state with retrieved profile data
     */
    async function fetchUserProfiles() {
      // Extract unique participant IDs (excluding current user)
      const uniqueUserIds = new Set<string>();
      chatRooms.forEach(chat => {
        chat.participants.forEach(participantId => {
          if (participantId !== userId) {
            uniqueUserIds.add(participantId);
          }
        });
      });

      // Fetch profile data for each unique user
      for (const id of uniqueUserIds) {
        try {
          const res = await fetch(`/api/users/profile?id=${id}`);
          if (res.status === 404) {
            setUserProfiles(prev => ({
              ...prev,
              [id]: { 
                firstName: 'Unknown', 
                lastName: 'User',
              }
            }));
            continue;
          }
          
          const data = await res.json();
          if (data.success) {
            setUserProfiles(prev => ({
              ...prev,
              [id]: data.user
            }));
          }
        } catch (err) {
          // Silent failure - we'll use fallback values
        }
      }
    }

    if (chatRooms.length > 0) {
      fetchUserProfiles();
    }
  }, [chatRooms, userId]);

  /**
   * Renders a loading state while fetching initial data
   */
  if (loading) {
    return (
      <div className="w-64 bg-grayfill border-solid border-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Messages</h2>
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-bgcolor text-white h-screen p-4 border-solid border-r border-gray-600">
      <h2 className="text-xl font-bold mb-4 text-textcolor">Messages</h2>
      
      {/* Search input with icon */}
      <div className="mb-4 relative bg-primary">
        <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
          <BsSearch className="text-bgcolor" />
        </div>
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full pl-8 pr-2 py-2 bg-primary text-bgcolor rounded focus:outline-none focus:ring-1 focus:ring-primary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <ul className="space-y-2">
        {chatRooms
          // Filter chat rooms based on search query
          .filter(chat => {
            const otherParticipantId = chat.participants.find(id => id !== userId) || "";
            const profile = userProfiles[otherParticipantId];
            
            // Show all rooms when no search query is provided
            if (!profile || !searchQuery.trim()) return true;
            
            // Filter by name match (case-insensitive)
            const fullName = `${profile.firstName} ${profile.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
          })
          .map((chat) => {
            // Find the other participant in the conversation
            const otherParticipantId = chat.participants.find(
              (id) => id !== userId
            ) || "";
            
            const profile = userProfiles[otherParticipantId];
            
            // Format display name with fallback to ID substring
            const otherParticipantName = profile ? 
              `${profile.firstName} ${profile.lastName}` : 
              otherParticipantId.substring(0, 8);
            
            // Display last message or placeholder text
            const lastMessage = chat.lastMessage?.content || "No messages yet";
            return (
              <li
                key={chat._id}
                className="p-2 bg-bgcolor hover:bg-sky-200 cursor-pointer text-textcolor border-solid border-t border-gray-600"
                onClick={() => onChatSelect(chat._id)}
              >
                <div className="flex flex- items-center space-x-2">
                  <BsPerson className="text-2xl"/>
                  <div className="flex flex-col">
                    <span>{otherParticipantName}</span>
                    <span className="text-sm text-gray-400">{lastMessage}</span>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}