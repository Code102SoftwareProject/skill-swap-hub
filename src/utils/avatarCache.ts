/**
 * Avatar caching utility to handle user avatar URLs with proper fallbacks
 */

interface AvatarCacheEntry {
  url: string | undefined;
  timestamp: number;
  isValid: boolean;
}

class AvatarCache {
  private cache = new Map<string, AvatarCacheEntry>();
  private readonly CACHE_DURATION = 300000; // 5 minutes

  /**
   * Get avatar URL for a user with caching
   */
  getAvatarUrl(userId: string, defaultUrl?: string): string | undefined {
    const entry = this.cache.get(userId);
    
    if (entry && Date.now() - entry.timestamp < this.CACHE_DURATION) {
      return entry.isValid ? entry.url : undefined;
    }
    
    return defaultUrl;
  }

  /**
   * Set avatar URL for a user
   */
  setAvatarUrl(userId: string, url: string | undefined, isValid: boolean = true): void {
    this.cache.set(userId, {
      url,
      timestamp: Date.now(),
      isValid
    });
  }

  /**
   * Mark an avatar as invalid (e.g., when image fails to load)
   */
  markInvalid(userId: string): void {
    const entry = this.cache.get(userId);
    if (entry) {
      entry.isValid = false;
    }
  }

  /**
   * Clear cache for a specific user (useful after profile updates)
   */
  clearUser(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear all cached avatars
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(userId);
      }
    }
  }
}

// Singleton instance
export const avatarCache = new AvatarCache();

// Auto cleanup every 5 minutes
setInterval(() => {
  avatarCache.cleanup();
}, 300000);

export default avatarCache;
