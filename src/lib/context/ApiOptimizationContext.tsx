"use client";

import React, { createContext, useContext, useCallback, useRef } from 'react';
import { cacheService } from '@/services/cacheService';
import { debouncedApiService } from '@/services/debouncedApiService';

interface ApiOptimizationContextType {
  clearUserCache: (userId: string) => void;
  getCacheInfo: () => { cache: any; pending: any };
  invalidateAll: () => void;
}

const ApiOptimizationContext = createContext<ApiOptimizationContextType | undefined>(undefined);

export function ApiOptimizationProvider({ children }: { children: React.ReactNode }) {
  const clearUserCache = useCallback((userId: string) => {
    // Clear all cache entries for the user
    cacheService.invalidatePattern(`.*${userId}.*`);
    debouncedApiService.invalidate(`.*${userId}.*`);
  }, []);

  const getCacheInfo = useCallback(() => {
    return {
      cache: cacheService.getInfo(),
      pending: debouncedApiService.getPendingInfo()
    };
  }, []);

  const invalidateAll = useCallback(() => {
    cacheService.clear();
  }, []);

  const value: ApiOptimizationContextType = {
    clearUserCache,
    getCacheInfo,
    invalidateAll
  };

  return (
    <ApiOptimizationContext.Provider value={value}>
      {children}
    </ApiOptimizationContext.Provider>
  );
}

export function useApiOptimization() {
  const context = useContext(ApiOptimizationContext);
  if (context === undefined) {
    throw new Error('useApiOptimization must be used within an ApiOptimizationProvider');
  }
  return context;
}
