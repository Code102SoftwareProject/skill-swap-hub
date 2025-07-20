import { IChatRoom, IMessage } from "@/types/chat";

// Background message cache
const messageCache = new Map<string, IMessage[]>();
const loadingRooms = new Set<string>();

// Progress tracking
let onProgressUpdate: ((loaded: number, total: number) => void) | null = null;

/**
 * Set progress update callback
 */
export function setProgressCallback(callback: (loaded: number, total: number) => void): void {
  onProgressUpdate = callback;
}

/**
 * Preload messages for multiple chat rooms in the background
 */
export async function preloadChatMessages(chatRooms: IChatRoom[], token?: string | null): Promise<void> {
  let loadedCount = 0;
  const totalRooms = chatRooms.length;
  
  const preloadPromises = chatRooms.map(async (room) => {
    // Skip if already loaded or currently loading
    if (messageCache.has(room._id) || loadingRooms.has(room._id)) {
      loadedCount++;
      onProgressUpdate?.(loadedCount, totalRooms);
      return;
    }

    loadingRooms.add(room._id);
    
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/messages?chatRoomId=${room._id}`, {
        headers
      });
      const data = await response.json();

      if (data.success && data.messages) {
        messageCache.set(room._id, data.messages);
        console.log(`Preloaded ${data.messages.length} messages for room ${room._id}`);
      }
    } catch (error) {
      console.error(`Error preloading messages for room ${room._id}:`, error);
    } finally {
      loadingRooms.delete(room._id);
      loadedCount++;
      onProgressUpdate?.(loadedCount, totalRooms);
    }
  });

  // Execute all preload operations in parallel
  await Promise.all(preloadPromises);
}

/**
 * Get cached messages for a chat room
 */
export function getCachedMessages(chatRoomId: string): IMessage[] | null {
  return messageCache.get(chatRoomId) || null;
}

/**
 * Update cached messages when new message arrives
 */
export function updateCachedMessages(chatRoomId: string, newMessage: IMessage): void {
  const cachedMessages = messageCache.get(chatRoomId);
  if (cachedMessages) {
    messageCache.set(chatRoomId, [...cachedMessages, newMessage]);
  }
}

/**
 * Clear cache for a specific room
 */
export function clearCachedMessages(chatRoomId: string): void {
  messageCache.delete(chatRoomId);
}

/**
 * Clear all cached messages
 */
export function clearAllCachedMessages(): void {
  messageCache.clear();
  loadingRooms.clear();
}

/**
 * Check if messages are cached for a room
 */
export function isMessagesCached(chatRoomId: string): boolean {
  return messageCache.has(chatRoomId);
}

/**
 * Check if messages are currently being loaded for a room
 */
export function isMessagesLoading(chatRoomId: string): boolean {
  return loadingRooms.has(chatRoomId);
}
