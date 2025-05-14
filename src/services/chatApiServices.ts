import { IChatRoom, IMessage } from "@/types/chat";

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
    const response = await fetch(`/api/users/profile?id=${userId}`);
    const data = (await response.json()) as UserProfileResponse;

    if (data.success && data.user) {
      return data.user;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
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
 * @returns Promise that resolves to the response data from the server,
 *          or throws an error if the message could not be sent
 */
export async function sendMessage(messageData: any) {
  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        const senderName = senderProfile ? 
          `${senderProfile.firstName} ${senderProfile.lastName}` : 
          "Someone";
        
        //  ! Create notification 
        await fetch("/api/notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: recipientId,
            typeno: 2, // Type 2 for new message notification
            description: `New message from ${senderName}`,
            targetDestination: `/chat`,
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
 * @returns Promise that resolves to an array of message objects,
 *          or an empty array if no messages exist or an error occurs
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
 * Mark multiple messages as read in a single request
 * 
 * @param messageIds - Array of message IDs to mark as read
 * @returns Promise with the response data
 */

