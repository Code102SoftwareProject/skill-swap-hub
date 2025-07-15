import { fetchChatRoom, fetchUserProfile } from './chatApiServices';

/**
 * Gets information about the other participant in a chat room
 */
export async function getOtherUserFromChatRoom(chatRoomId: string, currentUserId: string) {
  try {
    console.log(`Getting other user from chat room: ${chatRoomId}, current user: ${currentUserId}`);
    
    // Fetch the chat room data
    const chatRoom = await fetchChatRoom(chatRoomId);
    
    if (!chatRoom || !chatRoom.participants) {
      console.error('Chat room not found or has no participants');
      return null;
    }
    
    // Find the other user ID (participant who is not the current user)
    const otherUserId = chatRoom.participants.find(id => id !== currentUserId);
    
    if (!otherUserId) {
      console.error('Could not identify other user in chat room');
      return null;
    }
    
    console.log(`Found other user ID: ${otherUserId}`);
    
    // Get the other user's profile
    const userProfile = await fetchUserProfile(otherUserId);
    
    if (!userProfile) {
      return { id: otherUserId, name: 'Unknown User' };
    }
    
    return {
      id: otherUserId,
      name: `${userProfile.firstName} ${userProfile.lastName}`,
      avatar: userProfile.avatar
    };
  } catch (error) {
    console.error('Error getting other user from chat room:', error);
    return null;
  }
}