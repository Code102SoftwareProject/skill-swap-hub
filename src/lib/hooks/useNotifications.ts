import { useState, useEffect } from 'react';

interface NotificationHook {
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchUnreadCount: () => Promise<void>;
}

/**
 * Custom hook for managing notification state
 * @param userId - The user's ID
 * @returns Object containing notification data and functions
 */
export const useNotifications = (userId: string | null): NotificationHook => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notification/unread-count?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setUnreadCount(data.unreadCount);
      } else {
        setError(data.message || 'Failed to fetch unread count');
      }
    } catch (err) {
      setError('Error fetching notifications');
      console.error('Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count when component mounts or userId changes
  useEffect(() => {
    fetchUnreadCount();
  }, [userId]);

  return {
    unreadCount,
    loading,
    error,
    fetchUnreadCount
  };
};
