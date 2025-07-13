import { useState, useEffect, useCallback } from 'react';
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

export const useUserPreferences = () => {
  const { user, token } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only running client-side code after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = (authToken: string) => {
    if (!authToken || authToken === 'null' || authToken === 'undefined' || authToken.trim() === '') {
      throw new Error('No valid authentication token found');
    }
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!user || !mounted || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/preferences', {
        headers: getAuthHeaders(token)
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
  }, [user, mounted, token]); // Dependencies for useCallback

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!mounted || !user || !token) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data);
        return { success: true, data: data.data };
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [mounted, user, token]);

  // Watch/Unwatch post
  const toggleWatchPost = useCallback(async (postId: string, action: 'watch' | 'unwatch') => {
    if (!mounted || !user || !token) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    try {
      const response = await fetch('/api/user/watch-posts', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ postId, action })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state immediately for better UX
        if (preferences) {
          const updatedPreferences = { ...preferences };
          if (action === 'watch') {
            updatedPreferences.watchedPosts = [
              ...updatedPreferences.watchedPosts,
              { _id: postId }
            ];
          } else {
            updatedPreferences.watchedPosts = updatedPreferences.watchedPosts.filter(
              (post: any) => post._id !== postId
            );
          }
          setPreferences(updatedPreferences);
        }
        return { success: true, data: data.data };
      } else {
        throw new Error('Failed to update watch status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [mounted, user, token, preferences]);

  // Track interaction
  const trackInteraction = useCallback(async (interactionData: InteractionData) => {
    // Don't track if not mounted (SSR) or user not authenticated
    if (!mounted || !user || !token) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    try {
      const response = await fetch('/api/user/interactions', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(interactionData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        console.error('Track interaction API error:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.message || `API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error tracking interaction:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [mounted, user, token]);

  // Get personalized feed
  const getPersonalizedFeed = useCallback(async (page = 1, limit = 10) => {
    if (!mounted || !user || !token) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    try {
      const response = await fetch(`/api/user/feed?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders(token)
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
  }, [mounted, user, token]);

  // Check if post is watched
  const isPostWatched = useCallback((postId: string): boolean => {
    if (!mounted || !preferences || !preferences.watchedPosts) return false;
    return preferences.watchedPosts.some((post: any) => post._id === postId);
  }, [mounted, preferences]);

  // Get watched posts
  const getWatchedPosts = useCallback(async () => {
    if (!mounted || !user || !token) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    // Add small delay to ensure token is available and stable
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      // Get auth headers and handle token issues gracefully
      let headers;
      try {
        headers = getAuthHeaders(token);
      } catch (authError) {
        return { 
          success: false, 
          error: 'Authentication required. Please log in again.' 
        };
      }

      const response = await fetch('/api/user/watch-posts', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data || [] };
      } else if (response.status === 401) {
        return { 
          success: false, 
          error: 'Authentication expired. Please log in again.' 
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch saved posts');
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error occurred while fetching saved posts' 
      };
    }
  }, [mounted, user, token]);

  // Add forum to interests based on user behavior (when they watch posts from a forum)
  const addForumInterest = useCallback(async (forumId: string) => {
    if (!preferences || preferences.forumInterests.includes(forumId)) {
      return { success: true }; // Already interested or no preferences loaded
    }

    const updatedInterests = [...preferences.forumInterests, forumId];
    return updatePreferences({ forumInterests: updatedInterests });
  }, [preferences, updatePreferences]);

  // Get feed with enhanced customization
  const getCustomizedFeed = useCallback(async (page = 1, limit = 10, includeWatched = false) => {
    if (!mounted || !user || !token) {
      return { success: false, error: 'User not authenticated or component not mounted' };
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeWatched: includeWatched.toString()
      });

      const response = await fetch(`/api/user/feed?${params}`, {
        headers: getAuthHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data.data };
      } else {
        throw new Error('Failed to fetch customized feed');
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }, [mounted, user, token]);

  // Enhanced interaction tracking that also updates user interests
  const trackInteractionWithLearning = useCallback(async (interactionData: InteractionData) => {
    // Track the interaction first
    const result = await trackInteraction(interactionData);
    
    // If it's a view or like interaction, consider adding the forum to interests
    if (result.success && (interactionData.interactionType === 'view' || interactionData.interactionType === 'like')) {
      // Add forum interest automatically based on engagement
      await addForumInterest(interactionData.forumId);
    }
    
    return result;
  }, [trackInteraction, addForumInterest]);

  // Initialize preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    toggleWatchPost,
    trackInteraction,
    getPersonalizedFeed,
    isPostWatched,
    getWatchedPosts,
    addForumInterest,
    getCustomizedFeed,
    trackInteractionWithLearning
  };
};
