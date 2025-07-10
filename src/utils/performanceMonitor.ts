/**
 * Performance monitoring utility for cache effectiveness
 */

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
}

class PerformanceMonitor {
  private stats = {
    userProfiles: { hits: 0, misses: 0 },
    avatars: { hits: 0, misses: 0 }
  };

  recordHit(cacheType: 'userProfiles' | 'avatars'): void {
    this.stats[cacheType].hits++;
  }

  recordMiss(cacheType: 'userProfiles' | 'avatars'): void {
    this.stats[cacheType].misses++;
  }

  getStats(cacheType: 'userProfiles' | 'avatars'): CacheStats {
    const { hits, misses } = this.stats[cacheType];
    const totalRequests = hits + misses;
    const hitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0;

    return {
      hits,
      misses,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  logStats(): void {
    console.group('🚀 Cache Performance Stats');
    
    Object.keys(this.stats).forEach(cacheType => {
      const stats = this.getStats(cacheType as 'userProfiles' | 'avatars');
      console.log(`${cacheType}:`, {
        'Hit Rate': `${stats.hitRate}%`,
        'Hits': stats.hits,
        'Misses': stats.misses,
        'Total Requests': stats.totalRequests
      });
    });
    
    console.groupEnd();
  }

  reset(): void {
    this.stats = {
      userProfiles: { hits: 0, misses: 0 },
      avatars: { hits: 0, misses: 0 }
    };
  }
}

export const perfMonitor = new PerformanceMonitor();

// Log stats every 2 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    perfMonitor.logStats();
  }, 120000);
}

export default perfMonitor;
