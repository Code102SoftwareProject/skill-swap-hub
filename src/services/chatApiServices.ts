/**
 * API service for chat-related operations
 */

// Type definitions
import { IChatRoom, IMessage } from "@/types/chat";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

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
 * Fetch a chat room by ID
 */
export async function fetchChatRoom(chatRoomId: string): Promise<IChatRoom | null> {
  try {
    const response = await fetch(`/api/chatrooms?chatRoomId=${chatRoomId}`);
    const data = await response.json() as ChatRoomResponse;
    
    if (data.success && data.chatRooms && data.chatRooms.length > 0) {
      return data.chatRooms[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching chat room:', error);
    return null;
  }
}

/**
 * Fetch all chat rooms for a user
 */
export async function fetchUserChatRooms(userId: string): Promise<IChatRoom[]> {
  try {
    const response = await fetch(`/api/chatrooms?userId=${userId}`);
    const data = await response.json() as ChatRoomResponse;
    
    if (data.success && data.chatRooms) {
      return data.chatRooms;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching user chat rooms:', error);
    return [];
  }
}

/**
 * Fetch user profile by ID
 */
export async function fetchUserProfile(userId: string) {
  try {
    const response = await fetch(`/api/users/profile?id=${userId}`);
    const data = await response.json() as UserProfileResponse;
    
    if (data.success && data.user) {
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get a user's last online timestamp
 */
export async function fetchLastOnline(userId: string) {
  try {
    const response = await fetch(`/api/onlinelog?userId=${userId}`);
    const data = await response.json() as OnlineLogResponse;
    
    if (data.success && data.data?.lastOnline) {
      return data.data.lastOnline;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching last online status:', error);
    return null;
  }
}

/**
 * Update a user's online status
 */
export async function updateLastSeen(userId: string) {
  try {
    const response = await fetch('/api/onlinelog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    const data = await response.json() as OnlineLogResponse;
    
    if (data.success) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating online status:', error);
    return null;
  }
}

/**
 * Send a new message
 */
export async function sendMessage(messageData: any) {
  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Fetch messages for a chat room
 */
export async function fetchChatMessages(chatRoomId: string) {
  try {
    const response = await fetch(`/api/messages?chatRoomId=${chatRoomId}`);
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
 * Mark a message as read
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const response = await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
}