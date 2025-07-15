/**
 * Optimized Avatar Component with advanced loading states and performance optimizations
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import { imageOptimizationService } from '@/services/imageOptimizationService';
import { processAvatarUrl } from '@/utils/avatarUtils';

interface OptimizedAvatarProps {
  userId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showSkeleton?: boolean;
  priority?: boolean; // For above-the-fold images
  lazy?: boolean; // For lazy loading
}

const sizeClasses = {
  small: 'w-8 h-8',
  medium: 'w-10 h-10',
  large: 'w-12 h-12'
};

/**
 * Optimized Avatar Component with preloading, caching, and skeleton states
 */
const OptimizedAvatar = memo(({
  userId,
  firstName,
  lastName,
  avatarUrl,
  size = 'medium',
  className = '',
  showSkeleton = true,
  priority = false,
  lazy = true
}: OptimizedAvatarProps) => {
  const [imageState, setImageState] = useState<{
    src?: string;
    loading: boolean;
    error: boolean;
    showFallback: boolean;
  }>({
    loading: !!avatarUrl,
    error: false,
    showFallback: !avatarUrl
  });

  const [isInView, setIsInView] = useState(!lazy || priority);

  // Create stable fallback URL
  const fallbackUrl = React.useMemo(() => {
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
  }, [firstName, userId, size]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    const element = document.querySelector(`[data-avatar-id="${userId}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [lazy, priority, userId, isInView]);

  // Handle image loading
  const loadImage = useCallback(async () => {
    if (!avatarUrl || !isInView) return;

    try {
      setImageState(prev => ({ ...prev, loading: true, error: false }));

      // Process the avatar URL
      const processedUrl = processAvatarUrl(avatarUrl);
      if (!processedUrl) {
        setImageState(prev => ({ ...prev, loading: false, showFallback: true }));
        return;
      }

      // Get optimized URL
      const optimizedUrl = imageOptimizationService.getOptimizedUrl(processedUrl, size);

      // Preload the image
      const preloadedUrl = await imageOptimizationService.preloadImage(optimizedUrl);

      setImageState({
        src: preloadedUrl,
        loading: false,
        error: false,
        showFallback: false
      });

    } catch (error) {
      console.warn('Avatar loading failed:', error);
      setImageState({
        loading: false,
        error: true,
        showFallback: true
      });
    }
  }, [avatarUrl, size, isInView]);

  // Load image when conditions are met
  useEffect(() => {
    if (avatarUrl && isInView) {
      loadImage();
    }
  }, [avatarUrl, isInView, loadImage]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageState(prev => ({ ...prev, loading: false, error: false }));
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageState({
      loading: false,
      error: true,
      showFallback: true
    });
  }, []);

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden relative ${className}`;

  // Show skeleton loader
  if (imageState.loading && showSkeleton) {
    return (
      <div 
        className={`${baseClasses} bg-gray-200 animate-pulse`}
        data-avatar-id={userId}
      >
        <div className="w-full h-full bg-gray-300 rounded-full" />
      </div>
    );
  }

  // Show fallback
  if (imageState.showFallback || !imageState.src) {
    return (
      <div 
        className={`${baseClasses} bg-primary`}
        data-avatar-id={userId}
      >
        <Image 
          src={fallbackUrl}
          alt={`${firstName || 'User'}'s avatar`}
          width={size === 'small' ? 32 : size === 'medium' ? 40 : 48}
          height={size === 'small' ? 32 : size === 'medium' ? 40 : 48}
          className="w-full h-full object-cover"
          priority={priority}
          unoptimized // For SVG data URLs
        />
      </div>
    );
  }

  // Show actual image
  return (
    <div 
      className={baseClasses}
      data-avatar-id={userId}
    >
      {imageState.loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
      )}
      <Image 
        src={imageState.src}
        alt={`${firstName || 'User'}'s avatar`}
        width={size === 'small' ? 32 : size === 'medium' ? 40 : 48}
        height={size === 'small' ? 32 : size === 'medium' ? 40 : 48}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageState.loading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
        unoptimized // Since we're handling optimization ourselves
      />
    </div>
  );
});

OptimizedAvatar.displayName = 'OptimizedAvatar';

export default OptimizedAvatar;
