import { useState, useEffect, useCallback } from 'react';

interface UseUnreadMessagesReturn {
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchUnreadCount: () => Promise<void>;
}

/**
 * Custom hook for managing unread message count
 * @param userId - The user ID to fetch unread messages for
 * @param token - Optional JWT token for authentication
 * @returns Object containing unread count, loading state, error, and fetch function
 */
export const useUnreadMessages = (userId: string | null, token?: string | null): UseUnreadMessagesReturn => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

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
  }, [userId, token]);

  // Fetch unread count when userId or token changes
  useEffect(() => {
    fetchUnreadCount();
  }, [userId, token, fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    error,
    fetchUnreadCount
  };
};
