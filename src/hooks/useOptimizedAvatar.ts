/**
 * Custom hook for efficient avatar loading and caching
 */

import { useState, useEffect, useCallback } from 'react';
import { imageOptimizationService } from '@/services/imageOptimizationService';
import { processAvatarUrl } from '@/utils/avatarUtils';

interface UseAvatarOptions {
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
  lazy?: boolean;
}

interface AvatarState {
  src?: string;
  fallbackSrc: string;
  loading: boolean;
  error: boolean;
  isOptimized: boolean;
}

/**
 * Hook for optimized avatar loading with caching and fallback
 */
export function useOptimizedAvatar(
  userId: string,
  firstName?: string,
  lastName?: string,
  avatarUrl?: string,
  options: UseAvatarOptions = {}
) {
  const { size = 'medium', priority = false, lazy = true } = options;

  const [state, setState] = useState<AvatarState>(() => {
    const fallbackSrc = createFallbackAvatar(firstName, userId, size);
    return {
      fallbackSrc,
      loading: !!avatarUrl,
      error: false,
      isOptimized: false
    };
  });

  // Create fallback avatar
  const createFallbackAvatar = useCallback((
    firstName?: string, 
    userId?: string, 
    size?: string
  ): string => {
    const letter = firstName?.charAt(0)?.toUpperCase() || 
                   userId?.charAt(0)?.toUpperCase() || '?';
    
    const dimensions = size === 'small' ? 32 : size === 'medium' ? 40 : 48;
    
    const svg = `<svg width="${dimensions}" height="${dimensions}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${dimensions/2}" cy="${dimensions/2}" r="${dimensions/2}" fill="#3b82f6"/>
      <text x="${dimensions/2}" y="${dimensions/2 + 5}" font-family="system-ui, -apple-system, sans-serif" 
            font-size="${dimensions * 0.35}" font-weight="600" text-anchor="middle" fill="white">
        ${letter}
      </text>
    </svg>`;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, []);

  // Load optimized avatar
  const loadAvatar = useCallback(async () => {
    if (!avatarUrl) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: false }));

      // Process avatar URL
      const processedUrl = processAvatarUrl(avatarUrl, size);
      if (!processedUrl) {
        throw new Error('Failed to process avatar URL');
      }

      // Use optimization service
      const optimizedUrl = await imageOptimizationService.preloadImage(processedUrl);

      setState(prev => ({
        ...prev,
        src: optimizedUrl,
        loading: false,
        error: false,
        isOptimized: true
      }));

    } catch (error) {
      console.warn('Avatar loading failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: true,
        isOptimized: false
      }));
    }
  }, [avatarUrl, size]);

  // Load avatar when conditions are met
  useEffect(() => {
    if (priority || !lazy) {
      loadAvatar();
    }
  }, [loadAvatar, priority, lazy]);

  // Retry loading on error
  const retryLoad = useCallback(() => {
    loadAvatar();
  }, [loadAvatar]);

  // Preload related avatars (for chat lists, etc.)
  const preloadRelated = useCallback(async (relatedAvatars: string[]) => {
    const processedUrls = relatedAvatars
      .filter(Boolean)
      .map(url => processAvatarUrl(url, size))
      .filter(Boolean) as string[];

    if (processedUrls.length > 0) {
      await imageOptimizationService.preloadBatch(processedUrls);
    }
  }, [size]);

  return {
    ...state,
    retryLoad,
    preloadRelated,
    triggerLoad: loadAvatar
  };
}

/**
 * Hook for batch avatar preloading (useful for chat lists)
 */
export function useBatchAvatarPreload() {
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadAvatars = useCallback(async (
    avatars: Array<{
      userId: string;
      firstName?: string;
      avatarUrl?: string;
    }>,
    size: 'small' | 'medium' | 'large' = 'small'
  ) => {
    setIsPreloading(true);

    try {
      const urls = avatars
        .map(avatar => avatar.avatarUrl)
        .filter(Boolean)
        .map(url => processAvatarUrl(url, size))
        .filter(Boolean) as string[];

      if (urls.length > 0) {
        await imageOptimizationService.preloadBatch(urls);
      }
    } catch (error) {
      console.warn('Batch avatar preload failed:', error);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  return {
    preloadAvatars,
    isPreloading
  };
}

/**
 * Hook for avatar cache management
 */
export function useAvatarCache() {
  const getCacheStats = useCallback(() => {
    return imageOptimizationService.getCacheStats();
  }, []);

  const clearCache = useCallback(() => {
    imageOptimizationService.clearCache();
  }, []);

  return {
    getCacheStats,
    clearCache
  };
}
