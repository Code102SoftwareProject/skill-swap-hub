/**
 * Utility functions for System API authentication
 */

/**
 * Create headers with system API key for internal API calls
 * @returns Headers object with system API key authentication
 */
export function createSystemApiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-api-key': process.env.NEXT_PUBLIC_SYSTEM_API_KEY!,
  };
}

/**
 * Create headers with system API key for server-side API calls
 * (Uses server-side environment variable)
 * @returns Headers object with system API key authentication
 */
export function createServerSystemApiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-api-key': process.env.SYSTEM_API_KEY!,
  };
}
