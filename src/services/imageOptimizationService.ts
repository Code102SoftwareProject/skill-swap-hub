/**
 * Image optimization and caching service for better performance
 */

interface ImageCacheEntry {
  url: string;
  blob?: Blob;
  timestamp: number;
  loading: boolean;
  error?: boolean;
}

class ImageOptimizationService {
  private cache = new Map<string, ImageCacheEntry>();
  private preloadQueue = new Set<string>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CONCURRENT_LOADS = 3;
  private activeLoads = 0;

  /**
   * Preload an image and cache it
   */
  async preloadImage(url: string): Promise<string> {
    if (!url) return '';

    const cacheKey = this.getCacheKey(url);
    const cached = this.cache.get(cacheKey);

    // Return cached URL if valid
    if (cached && !cached.error && Date.now() - cached.timestamp < this.CACHE_TTL) {
      if (cached.blob) {
        return URL.createObjectURL(cached.blob);
      }
      return cached.url;
    }

    // If already loading, wait for it
    if (cached?.loading) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const entry = this.cache.get(cacheKey);
          if (entry && !entry.loading) {
            clearInterval(checkInterval);
            if (entry.error) {
              resolve(url); // Fallback to original URL
            } else if (entry.blob) {
              resolve(URL.createObjectURL(entry.blob));
            } else {
              resolve(entry.url);
            }
          }
        }, 50);
      });
    }

    // Mark as loading
    this.cache.set(cacheKey, {
      url,
      timestamp: Date.now(),
      loading: true
    });

    try {
      // Limit concurrent loads
      if (this.activeLoads >= this.CONCURRENT_LOADS) {
        await this.waitForSlot();
      }

      this.activeLoads++;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      
      // Update cache with successful load
      this.cache.set(cacheKey, {
        url,
        blob,
        timestamp: Date.now(),
        loading: false
      });

      this.activeLoads--;
      this.cleanupCache();

      return URL.createObjectURL(blob);
    } catch (error) {
      this.activeLoads--;
      console.warn('Image preload failed:', url, error);
      
      // Mark as error but don't remove from cache immediately
      this.cache.set(cacheKey, {
        url,
        timestamp: Date.now(),
        loading: false,
        error: true
      });

      return url; // Return original URL as fallback
    }
  }

  /**
   * Get optimized image URL with size parameters
   */
  getOptimizedUrl(originalUrl: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    if (!originalUrl) return '';

    // If it's already using our API route, add size parameter
    if (originalUrl.includes('/api/file/retrieve')) {
      const url = new URL(originalUrl, window.location.origin);
      url.searchParams.set('size', size);
      return url.toString();
    }

    return originalUrl;
  }

  /**
   * Preload multiple images in batches
   */
  async preloadBatch(urls: string[]): Promise<string[]> {
    const uniqueUrls = [...new Set(urls.filter(Boolean))];
    const batchSize = 5;
    const results: string[] = [];

    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(url => this.preloadImage(url))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push(batch[index]); // Fallback to original URL
        }
      });
    }

    return results;
  }

  /**
   * Create optimized avatar URL with fallback
   */
  createAvatarUrl(avatarUrl?: string, userId?: string, firstName?: string): {
    optimizedUrl?: string;
    fallbackUrl: string;
    shouldPreload: boolean;
  } {
    // Create fallback first
    const fallbackUrl = this.createFallbackAvatar(firstName, userId);

    if (!avatarUrl) {
      return {
        fallbackUrl,
        shouldPreload: false
      };
    }

    // Get optimized URL
    const optimizedUrl = this.getOptimizedUrl(avatarUrl, 'small');

    return {
      optimizedUrl,
      fallbackUrl,
      shouldPreload: true
    };
  }

  /**
   * Create a fallback avatar SVG
   */
  private createFallbackAvatar(firstName?: string, userId?: string): string {
    const letter = firstName?.charAt(0)?.toUpperCase() || 
                   userId?.charAt(0)?.toUpperCase() || '?';
    
    // Create a simple, fast-loading SVG
    const svg = `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#3b82f6"/>
      <text x="20" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="middle" fill="white">
        ${letter}
      </text>
    </svg>`;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  /**
   * Wait for an available loading slot
   */
  private async waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.activeLoads < this.CONCURRENT_LOADS) {
          resolve();
        } else {
          setTimeout(checkSlot, 10);
        }
      };
      checkSlot();
    });
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) return;

    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp and remove oldest entries
    entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, this.cache.size - this.MAX_CACHE_SIZE)
      .forEach(([key, entry]) => {
        if (entry.blob) {
          URL.revokeObjectURL(URL.createObjectURL(entry.blob));
        }
        this.cache.delete(key);
      });
  }

  /**
   * Get cache key for URL
   */
  private getCacheKey(url: string): string {
    return `img_${url}`;
  }

  /**
   * Clear cache and revoke object URLs
   */
  clearCache(): void {
    this.cache.forEach((entry) => {
      if (entry.blob) {
        URL.revokeObjectURL(URL.createObjectURL(entry.blob));
      }
    });
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    activeLoads: number;
    hitRate: number;
  } {
    const totalEntries = this.cache.size;
    const errorEntries = Array.from(this.cache.values()).filter(e => e.error).length;
    
    return {
      size: totalEntries,
      activeLoads: this.activeLoads,
      hitRate: totalEntries > 0 ? ((totalEntries - errorEntries) / totalEntries) * 100 : 0
    };
  }
}

export const imageOptimizationService = new ImageOptimizationService();
