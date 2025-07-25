/**
 * Utility functions for handling avatar URLs and image processing
 */

/**
 * Processes an avatar URL to use the file retrieval API if needed
 * 
 * @param avatarUrl - The original avatar URL from the database
 * @param size - Optional size parameter for optimization
 * @returns Processed URL that can be used directly in img src
 */
export function processAvatarUrl(avatarUrl: string | undefined, size?: 'small' | 'medium' | 'large'): string | undefined {
  if (!avatarUrl) return undefined;

  // Build the API URL with optional size parameter
  const buildApiUrl = (baseParam: string, value: string) => {
    const url = new URL('/api/file/retrieve', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    url.searchParams.set(baseParam, value);
    if (size) {
      url.searchParams.set('size', size);
    }
    return url.toString();
  };

  // If it's already a relative URL or doesn't need processing, return as-is
  if (avatarUrl.startsWith('/') || avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:')) {
    return avatarUrl;
  }

  // If it's a Google profile picture URL, use it directly (don't route through file API)
  if (avatarUrl.includes('googleusercontent.com') || avatarUrl.includes('googleapis.com')) {
    return avatarUrl;
  }

  // If it's any other external URL (social media avatars, etc.), use directly
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    // Only route through file API if it's from our own storage domains
    if (avatarUrl.includes('r2.cloudflarestorage.com') || avatarUrl.includes('skillswaphub')) {
      return buildApiUrl('fileUrl', avatarUrl);
    }
    return avatarUrl;
  }

  // If it's a direct filename (like avatars/userId-timestamp-filename.jpg)
  if (avatarUrl.startsWith('avatars/')) {
    return buildApiUrl('file', avatarUrl);
  }

  // For any other case, assume it's a filename and route through API
  return buildApiUrl('file', avatarUrl);
}

/**
 * Creates a fallback avatar URL based on user's name
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns A data URL for a simple text-based avatar
 */
export function createFallbackAvatar(firstName?: string, lastName?: string): string {
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';
  
  // Create a simple SVG avatar with initials
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#3b82f6"/>
      <text x="20" y="28" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">
        ${initials}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Gets the first letter for text fallback
 * 
 * @param firstName - User's first name
 * @param fallbackId - Fallback ID if no name available
 * @returns Single character for display
 */
export function getFirstLetter(firstName?: string, fallbackId?: string): string {
  if (firstName && firstName.length > 0) {
    return firstName.charAt(0).toUpperCase();
  }
  
  if (fallbackId && fallbackId.length > 0) {
    return fallbackId.charAt(0).toUpperCase();
  }
  
  return '?';
}
