// Enhanced useUserPreferences hook with optional WebSocket support
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

interface UserPreferences {
  _id: string;
  userId: string;
  forumInterests: string[];
  watchedPosts: any[];
  likedCategories: string[];
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
    realTimeUpdates: boolean; // New option for WebSocket
  };
  interactionHistory: any[];
}

interface InteractionData {
  postId: string;
  forumId: string;
  interactionType: 'view' | 'like' | 'dislike' | 'comment' | 'share';
  timeSpent?: number;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  isComplete?: boolean;
}

interface WebSocketMessage {
  type: 'NEW_POST' | 'INTERACTION_UPDATE' | 'PREFERENCE_CHANGE' | 'NOTIFICATION';
  data: any;
  userId: string;
}

export const useUserPreferencesEnhanced = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState<any[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot access localStorage during server-side rendering');
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('No valid authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!user || !mounted || !preferences?.preferences.realTimeUpdates) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const wsUrl = `ws://localhost:3000/ws/feed?token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connected for real-time feed updates');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.userId === user._id) {
            handleWebSocketMessage(message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        
        // Auto-reconnect after 5 seconds
        if (preferences?.preferences.realTimeUpdates) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Real-time connection error');
      };

    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setError('Failed to establish real-time connection');
    }
  }, [user, mounted, preferences?.preferences.realTimeUpdates]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'NEW_POST':
        // Add new post that matches user interests
        setRealTimeUpdates(prev => [{
          id: Date.now(),
          type: 'new_post',
          data: message.data,
          timestamp: new Date()
        }, ...prev.slice(0, 9)]); // Keep last 10 updates
        break;
        
      case 'INTERACTION_UPDATE':
        // Update interaction counts in real-time
        setRealTimeUpdates(prev => [{
          id: Date.now(),
          type: 'interaction',
          data: message.data,
          timestamp: new Date()
        }, ...prev.slice(0, 9)]);
        break;
        
      case 'NOTIFICATION':
        // Show real-time notification
        setRealTimeUpdates(prev => [{
          id: Date.now(),
          type: 'notification',
          data: message.data,
          timestamp: new Date()
        }, ...prev.slice(0, 9)]);
        break;
        
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Fetch user preferences (HTTP - for reliability)
  const fetchPreferences = useCallback(async () => {
    if (!user || !mounted) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/preferences', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
        setError(null);
      } else {
        throw new Error('Failed to fetch preferences');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [user, mounted]);

  // Update preferences (HTTP)
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!mounted || !user) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        const newPreferences = data.data;
        setPreferences(newPreferences);
        
        // Handle WebSocket connection based on real-time preference
        if (newPreferences.preferences.realTimeUpdates && !isConnected) {
          connectWebSocket();
        } else if (!newPreferences.preferences.realTimeUpdates && isConnected) {
          disconnectWebSocket();
        }
        
        return { success: true, data: newPreferences };
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [mounted, user, isConnected, connectWebSocket, disconnectWebSocket]);

  // Get personalized feed (HTTP - for pagination and reliability)
  const getPersonalizedFeed = useCallback(async (page = 1, limit = 10) => {
    if (!mounted || !user) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    try {
      const response = await fetch(`/api/user/feed?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data };
      } else {
        throw new Error('Failed to fetch personalized feed');
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }, [mounted, user]);

  // Track interaction (HTTP - for reliability)
  const trackInteraction = useCallback(async (interactionData: InteractionData) => {
    if (!mounted || !user) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    try {
      const response = await fetch('/api/user/interactions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(interactionData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        throw new Error(data.message || `API error: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [mounted, user]);

  // Toggle real-time updates
  const toggleRealTimeUpdates = useCallback(async (enabled: boolean) => {
    return updatePreferences({
      preferences: {
        ...preferences?.preferences,
        realTimeUpdates: enabled
      }
    });
  }, [preferences, updatePreferences]);

  // Clear real-time updates
  const clearRealTimeUpdates = useCallback(() => {
    setRealTimeUpdates([]);
  }, []);

  // Initialize preferences and WebSocket
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Manage WebSocket connection based on preferences
  useEffect(() => {
    if (preferences?.preferences.realTimeUpdates && !isConnected) {
      connectWebSocket();
    } else if (!preferences?.preferences.realTimeUpdates && isConnected) {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [preferences?.preferences.realTimeUpdates, isConnected, connectWebSocket, disconnectWebSocket]);

  return {
    preferences,
    loading,
    error,
    isConnected,
    realTimeUpdates,
    fetchPreferences,
    updatePreferences,
    getPersonalizedFeed,
    trackInteraction,
    toggleRealTimeUpdates,
    clearRealTimeUpdates,
    // Keep existing functions for backward compatibility
    toggleWatchPost: async () => ({}), // Implement as needed
    isPostWatched: () => false, // Implement as needed
    getWatchedPosts: async () => ({}) // Implement as needed
  };
};
