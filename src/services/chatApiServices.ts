import { IChatRoom, IMessage } from "@/types/chat";
import { method } from "lodash";
import { createSystemApiHeaders } from "@/utils/systemApiAuth";

interface ChatRoomResponse {
  success: boolean;
  message?: string;
  chatRooms?: IChatRoom[];
  chatRoom?: IChatRoom;
}

interface UserProfileResponse {
  success: boolean;
  message?: string;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
    [key: string]: any;
  };
}

interface OnlineLogResponse {
  success: boolean;
  message?: string;
  data?: {
    userId: string;
    lastOnline: string;
  };
}

/**
 * Helper function to create authenticated headers
 */
function createAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 ** Fetch a chat room by chatRoomId
 *
 * @param chatRoomId - The unique identifier of the chat room to retrieve
 * @returns Promise that resolves to the IChatRoom object if found,
 *          or null if the chat room doesn't exist or an error occurs
 */
export async function fetchChatRoom(
  chatRoomId: string
): Promise<IChatRoom | null> {
  try {
    const response = await fetch(`/api/chatrooms?chatRoomId=${chatRoomId}`);
    const data = (await response.json()) as ChatRoomResponse;

    if (data.success && data.chatRooms && data.chatRooms.length > 0) {
      return data.chatRooms[0];
    }

    return null;
  } catch (error) {
    console.error("Error fetching chat room:", error);
    return null;
  }
}

/**
 ** Fetch all chat rooms associated with a specific user
 *
 * @param userId - The unique identifier of the user whose chat rooms to retrieve
 * @returns Promise that resolves to an array of IChatRoom objects,
 *          or an empty array if no chat rooms exist or an error occurs
 */
export async function fetchUserChatRooms(userId: string): Promise<IChatRoom[]> {
  try {
    const response = await fetch(`/api/chatrooms?userId=${userId}`);
    const data = (await response.json()) as ChatRoomResponse;

    if (data.success && data.chatRooms) {
      return data.chatRooms;
    }

    return [];
  } catch (error) {
    console.error("Error fetching user chat rooms:", error);
    return [];
  }
}

/**
 **Fetch a user's profile information by their ID
 *
 * @param userId - The unique identifier of the user whose profile to retrieve
 * @returns Promise that resolves to an object containing user profile data (firstName, lastName, avatar, etc.),
 *          or null if the user doesn't exist or an error occurs
 */
export async function fetchUserProfile(userId: string) {
  try {
    console.log(`Fetching profile for user: ${userId}`);
    const response = await fetch(`/api/users/profile?id=${userId}`);
    const data = (await response.json()) as UserProfileResponse;

    if (data.success && data.user) {
      console.log(`Profile fetched successfully for user: ${userId}`, data.user);
      return data.user;
    }

    console.log(`No profile found for user: ${userId}`);
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Fetch multiple user profiles - simple version
 * 
 * @param userIds - Array of user IDs to fetch profiles for
 * @returns Promise that resolves to a map of userId -> profile data
 */
export async function fetchUserProfiles(userIds: string[]) {
  const profiles: { [key: string]: any } = {};

  console.log(`Fetching profiles for ${userIds.length} users:`, userIds);
  
  // Fetch each profile
  const fetchPromises = userIds.map(async (userId) => {
    try {
      const response = await fetch(`/api/users/profile?id=${userId}`);
      const data = (await response.json()) as UserProfileResponse;

      if (data.success && data.user) {
        console.log(`Profile fetched for user ${userId}:`, data.user);
        return { userId, profile: data.user };
      }
      console.log(`No profile found for user: ${userId}`);
      return { userId, profile: null };
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      return { userId, profile: null };
    }
  });

  const results = await Promise.all(fetchPromises);
  
  // Add results to profiles map
  results.forEach(({ userId, profile }) => {
    if (profile) {
      profiles[userId] = profile;
    } else {
      // Set default profile for failed fetches
      profiles[userId] = {
        firstName: "Unknown",
        lastName: "User",
      };
    }
  });

  console.log('Final profiles object:', profiles);
  return profiles;
}

/**
 * Invalidate cached profile for a user (useful after profile updates)
 * 
 * @param userId - The user ID whose cache should be invalidated
 */
export async function invalidateUserProfileCache(userId: string) {
  console.log(`Cache invalidation requested for user: ${userId} (no caching implemented)`);
}

/**
 ** Get a user's last online time
 *
 * @param userId - The unique identifier of the user whose online status to check
 * @returns Promise that resolves to a string containing the ISO timestamp of when the user was last online,
 *          or null if the information is not available or an error occurs
 */
export async function fetchLastOnline(userId: string) {
  try {
    const response = await fetch(`/api/onlinelog?userId=${userId}`);
    const data = (await response.json()) as OnlineLogResponse;

    if (data.success && data.data?.lastOnline) {
      return data.data.lastOnline;
    }

    return null;
  } catch (error) {
    console.error("Error fetching last online status:", error);
    return null;
  }
}

/**
 * Update a user's online status to the current time
 *
 * @param userId - The unique identifier of the user whose online status to update
 * @returns Promise that resolves to an object containing the updated online log data,
 *          or null if the update fails or an error occurs
 */
export async function updateLastSeen(userId: string) {
  try {
    const response = await fetch("/api/onlinelog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    const data = (await response.json()) as OnlineLogResponse;

    if (data.success) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error("Error updating online status:", error);
    return null;
  }
}

/**
 * Send a new message in a chat room
 *
 * @param messageData - Object containing message details, including:
 *                      chatRoomId<senderId, content,timestamp:
 * @param token - Optional JWT token for authentication
 * @returns Promise that resolves to the response data from the server,
 *          or throws an error if the message could not be sent
 */
export async function sendMessage(messageData: any, token?: string | null) {
  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify(messageData),
    });

    const data = await response.json();
    
    // get chat room details to find recipient
    const chatRoom = await fetchChatRoom(messageData.chatRoomId);
    
    if (chatRoom && chatRoom.participants) {
      // Get recipient
      const recipientId = chatRoom.participants.find(
        (participant) => participant.toString() !== messageData.senderId
      );
      
      if (recipientId) {
        // Get sender user profile 
        const senderProfile = await fetchUserProfile(messageData.senderId);
        const senderName = (senderProfile && typeof senderProfile === 'object' && 'firstName' in senderProfile && 'lastName' in senderProfile) ? 
          `${(senderProfile as any).firstName} ${(senderProfile as any).lastName}` : 
          "Someone";
        
        //  ! Create notification 
        await fetch("/api/notification", {
          method: "POST",
          headers: createSystemApiHeaders(),
          body: JSON.stringify({
            userId: recipientId,
            typeno: 2, // Type 2 for new message notification
            description: `New message from ${senderName}`,
            targetDestination: `/user/chat`,
          }),
        });
      }
    }

    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Fetch all messages for a specific chat room
 *
 * @param chatRoomId - The unique identifier of the chat room whose messages to retrieve
 * @param token - Optional JWT token for authentication
 * @returns Promise that resolves to an array of message objects,
 *          or an empty array if no messages exist or an error occurs
 */
export async function fetchChatMessages(chatRoomId: string, token?: string | null) {
  try {
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/messages?chatRoomId=${chatRoomId}`, {
      headers
    });
    const data = await response.json();

    if (data.success) {
      return data.messages;
    }

    return [];
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

/**
 * Mark multiple messages as read in a single request
 * 
 * @param messageIds - Array of message IDs to mark as read
 * @param token - Optional JWT token for authentication
 * @returns Promise with the response data
 */
export async function markMessagesAsRead(messageIds: string[], token?: string | null) {
  try {
    const response = await fetch("/api/messages/read-status", {
      method: "PATCH",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ messageIds }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}

/**
 * Get unread message count for a user
 * 
 * @param userId - The user ID to get unread count for
 * @param token - Optional JWT token for authentication
 * @returns Promise with the unread count
 */
export async function fetchUnreadMessageCount(userId: string, token?: string | null) {
  try {
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/messages/unread-count?userId=${userId}`, {
      headers
    });
    const data = await response.json();

    if (data.success) {
      return data.unreadCount;
    }

    return 0;
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    return 0;
  }
}

/**
 * Get unread message counts per chat room for a user
 * 
 * @param userId - The user ID to get unread counts for
 * @param token - Optional JWT token for authentication
 * @returns Promise with the unread counts map (chatRoomId -> count)
 */
export async function fetchUnreadMessageCountsByRoom(userId: string, token?: string | null) {
  try {
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/messages/unread-by-room?userId=${userId}`, {
      headers
    });
    const data = await response.json();

    if (data.success) {
      return data.unreadCounts || {};
    }

    return {};
  } catch (error) {
    console.error("Error fetching unread message counts by room:", error);
    return {};
  }
}

/**
 * Mark unread messages as read for a specific chat room and user
 * 
 * @param chatRoomId - The chat room ID
 * @param userId - The current user ID (to exclude their own messages)
 * @param token - Optional JWT token for authentication
 * @returns Promise with the response data
 */
export async function markChatRoomMessagesAsRead(chatRoomId: string, userId: string, token?: string | null) {
  try {
    // First, get all messages for this chat room
    const messages = await fetchChatMessages(chatRoomId, token);
    
    // Filter for unread messages sent by others (not current user)
    const unreadMessageIds = messages
      .filter((msg: any) => 
        msg.senderId.toString() !== userId && 
        !msg.readStatus &&
        msg._id
      )
      .map((msg: any) => msg._id!.toString());

    // Only make API call if there are unread messages
    if (unreadMessageIds.length > 0) {
      return await markMessagesAsRead(unreadMessageIds, token);
    }

    return { success: true, message: "No unread messages to mark", modifiedCount: 0 };
  } catch (error) {
    console.error("Error marking chat room messages as read:", error);
    throw error;
  }
}