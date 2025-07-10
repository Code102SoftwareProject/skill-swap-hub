import { useState, useEffect } from 'react';

interface UseUnreadMessagesReturn {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchUnreadCount: () => Promise<void>;
}

/**
 * Custom hook for managing unread message count
 * @param userId - The user ID to fetch unread messages for
 * @returns Object containing unread count, loading state, error, and fetch function
 */
export const useUnreadMessages = (userId: string | null): UseUnreadMessagesReturn => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/unread-count?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.unreadCount);
      } else {
        setError(data.message || 'Failed to fetch unread message count');
      }
    } catch (err) {
      setError('Error fetching unread message count');
      console.error('Error fetching unread message count:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count when userId changes
  useEffect(() => {
    fetchUnreadCount();
  }, [userId]);

  return {
    unreadCount,
    isLoading,
    error,
    fetchUnreadCount
  };
};
