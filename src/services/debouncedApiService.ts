import { cacheService } from './cacheService';

/**
 * Debounced API service to prevent redundant calls
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class DebouncedApiService {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly DEBOUNCE_TIME = 300; // 300ms

  /**
   * Make a debounced API call - if same request is pending, return existing promise
   */
  async makeRequest<T>(
    cacheKey: string,
    apiCall: () => Promise<T>,
    ttl: number = 30000
  ): Promise<T> {
    // Check cache first
    const cached = cacheService.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      // If request is very recent, return the pending promise
      if (Date.now() - pending.timestamp < this.DEBOUNCE_TIME) {
        return pending.promise;
      }
    }

    // Make new request
    const promise = apiCall()
      .then(result => {
        // Cache the result
        cacheService.set(cacheKey, result, ttl);
        // Remove from pending
        this.pendingRequests.delete(cacheKey);
        return result;
      })
      .catch(error => {
        // Remove from pending on error
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Store as pending
    this.pendingRequests.set(cacheKey, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Invalidate cache and cancel pending requests for a pattern
   */
  invalidate(pattern: string): void {
    cacheService.invalidatePattern(pattern);
    
    const regex = new RegExp(pattern);
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Get info about pending requests
   */
  getPendingInfo(): { count: number; keys: string[] } {
    return {
      count: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys())
    };
  }
}

export const debouncedApiService = new DebouncedApiService();
export default debouncedApiService;
