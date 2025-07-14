/**
 * Utility functions for handling avatar URLs and image processing
 */

/**
 * Processes an avatar URL to use the file retrieval API if needed
 * 
 * @param avatarUrl - The original avatar URL from the database
 * @returns Processed URL that can be used directly in img src
 */
export function processAvatarUrl(avatarUrl: string | undefined): string | undefined {
  if (!avatarUrl) return undefined;

  // If it's already a relative URL or doesn't need processing, return as-is
  if (avatarUrl.startsWith('/') || avatarUrl.startsWith('data:') || avatarUrl.startsWith('blob:')) {
    return avatarUrl;
  }

  // If it's an R2 URL, convert to use retrieval API
  if (avatarUrl.includes('r2.cloudflarestorage.com') || avatarUrl.includes('skillswaphub')) {
    return `/api/file/retrieve?fileUrl=${encodeURIComponent(avatarUrl)}`;
  }

  // If it's a direct filename (like avatars/userId-timestamp-filename.jpg)
  if (avatarUrl.startsWith('avatars/')) {
    return `/api/file/retrieve?file=${encodeURIComponent(avatarUrl)}`;
  }

  // For other URLs, try direct access first
  return avatarUrl;
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