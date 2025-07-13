/**
 * Performance monitoring utility for image loading
 */

interface PerformanceMetrics {
  imageLoads: {
    total: number;
    successful: number;
    failed: number;
    cacheHits: number;
    averageLoadTime: number;
  };
  cacheStats: {
    size: number;
    hitRate: number;
  };
}

class ImagePerformanceMonitor {
  private metrics: PerformanceMetrics = {
    imageLoads: {
      total: 0,
      successful: 0,
      failed: 0,
      cacheHits: 0,
      averageLoadTime: 0
    },
    cacheStats: {
      size: 0,
      hitRate: 0
    }
  };

  private loadTimes: number[] = [];
  private readonly MAX_LOAD_TIMES = 100; // Keep last 100 load times

  /**
   * Record a successful image load
   */
  recordSuccess(loadTimeMs: number, fromCache: boolean = false): void {
    this.metrics.imageLoads.total++;
    this.metrics.imageLoads.successful++;
    
    if (fromCache) {
      this.metrics.imageLoads.cacheHits++;
    }

    // Track load times
    this.loadTimes.push(loadTimeMs);
    if (this.loadTimes.length > this.MAX_LOAD_TIMES) {
      this.loadTimes.shift();
    }

    // Update average
    this.metrics.imageLoads.averageLoadTime = 
      this.loadTimes.reduce((sum, time) => sum + time, 0) / this.loadTimes.length;
  }

  /**
   * Record a failed image load
   */
  recordFailure(): void {
    this.metrics.imageLoads.total++;
    this.metrics.imageLoads.failed++;
  }

  /**
   * Update cache statistics
   */
  updateCacheStats(size: number, hitRate: number): void {
    this.metrics.cacheStats.size = size;
    this.metrics.cacheStats.hitRate = hitRate;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    successRate: number;
    cacheHitRate: number;
    averageLoadTime: number;
    totalLoads: number;
  } {
    const { imageLoads } = this.metrics;
    
    return {
      successRate: imageLoads.total > 0 ? (imageLoads.successful / imageLoads.total) * 100 : 0,
      cacheHitRate: imageLoads.total > 0 ? (imageLoads.cacheHits / imageLoads.total) * 100 : 0,
      averageLoadTime: imageLoads.averageLoadTime,
      totalLoads: imageLoads.total
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      imageLoads: {
        total: 0,
        successful: 0,
        failed: 0,
        cacheHits: 0,
        averageLoadTime: 0
      },
      cacheStats: {
        size: 0,
        hitRate: 0
      }
    };
    this.loadTimes = [];
  }

  /**
   * Log performance summary to console (for debugging)
   */
  logSummary(): void {
    const summary = this.getSummary();
    console.group('🖼️ Image Performance Summary');
    console.log('Total loads:', summary.totalLoads);
    console.log('Success rate:', `${summary.successRate.toFixed(1)}%`);
    console.log('Cache hit rate:', `${summary.cacheHitRate.toFixed(1)}%`);
    console.log('Average load time:', `${summary.averageLoadTime.toFixed(1)}ms`);
    console.log('Cache size:', this.metrics.cacheStats.size);
    console.groupEnd();
  }
}

export const imagePerformanceMonitor = new ImagePerformanceMonitor();

/**
 * Hook for tracking image load performance
 */
export function useImagePerformance() {
  const trackImageLoad = (startTime: number, success: boolean, fromCache: boolean = false) => {
    const loadTime = Date.now() - startTime;
    
    if (success) {
      imagePerformanceMonitor.recordSuccess(loadTime, fromCache);
    } else {
      imagePerformanceMonitor.recordFailure();
    }
  };

  const getPerformanceMetrics = () => imagePerformanceMonitor.getMetrics();
  const getPerformanceSummary = () => imagePerformanceMonitor.getSummary();
  const logPerformance = () => imagePerformanceMonitor.logSummary();

  return {
    trackImageLoad,
    getPerformanceMetrics,
    getPerformanceSummary,
    logPerformance
  };
}
