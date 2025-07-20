import { debouncedApiService } from './debouncedApiService';
import { cacheService } from './cacheService';

interface SessionResponse {
  success: boolean;
  message?: string;
  sessions?: any[];
  session?: any;
}

/**
 * Helper function to create authorization headers
 * @param token - JWT token (optional)
 * @returns Headers object with authorization if token is provided
 */
function createAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Fetch sessions for a specific user
 * @param userId - The user ID to fetch sessions for
 * @param status - Optional status filter (pending, active, completed, canceled, rejected)
 * @returns Promise that resolves to an array of session objects
 */
export async function fetchUserSessions(userId: string, status?: string): Promise<any[]> {
  const cacheKey = `sessions-${userId}-${status || 'all'}`;
  
  return debouncedApiService.makeRequest(
    cacheKey,
    async () => {
      const params = new URLSearchParams({ userId });
      if (status) {
        params.append('status', status);
      }
      
      const response = await fetch(`/api/session?${params.toString()}`);
      const data = (await response.json()) as SessionResponse;

      if (data.success && data.sessions) {
        return data.sessions;
      }

      return [];
    },
    15000 // 15 second cache
  );
}

/**
 * Fetch active sessions for a user
 * @param userId - The user ID to fetch active sessions for
 * @returns Promise that resolves to an array of active session objects
 */
export async function fetchActiveSessions(userId: string): Promise<any[]> {
  return fetchUserSessions(userId, 'active');
}

/**
 * Fetch pending sessions for a user
 * @param userId - The user ID to fetch pending sessions for
 * @returns Promise that resolves to an array of pending session objects
 */
export async function fetchPendingSessions(userId: string): Promise<any[]> {
  return fetchUserSessions(userId, 'pending');
}

/**
 * Check if user has active sessions or pending session requests
 * @param userId - The user ID to check
 * @returns Promise that resolves to boolean indicating if there are active/pending sessions
 */
export async function hasActiveOrPendingSessions(userId: string): Promise<boolean> {
  const cacheKey = `session-indicator-${userId}`;
  
  return debouncedApiService.makeRequest(
    cacheKey,
    async () => {
      // Fetch both active and pending in parallel
      const [activeSessions, pendingSessions] = await Promise.all([
        fetchActiveSessions(userId),
        fetchPendingSessions(userId)
      ]);

      return activeSessions.length > 0 || pendingSessions.length > 0;
    },
    10000 // 10 second cache for indicators
  );
}

/**
 * Get session count for a user by status
 * @param userId - The user ID
 * @param status - Session status to count
 * @returns Promise that resolves to the count of sessions
 */
export async function getSessionCount(userId: string, status: string): Promise<number> {
  try {
    const sessions = await fetchUserSessions(userId, status);
    return sessions.length;
  } catch (error) {
    console.error(`Error getting ${status} session count:`, error);
    return 0;
  }
}

/**
 * Get sessions between two specific users
 * @param user1Id - First user ID
 * @param user2Id - Second user ID
 * @returns Promise that resolves to an array of sessions between the two users
 */
export async function fetchSessionsBetweenUsers(user1Id: string, user2Id: string): Promise<any[]> {
  try {
    const allSessions = await fetchUserSessions(user1Id);
    
    // Filter sessions that involve both users
    const sessionsBetweenUsers = allSessions.filter(session => {
      const sessionUser1 = session.user1Id?._id || session.user1Id;
      const sessionUser2 = session.user2Id?._id || session.user2Id;
      
      return (
        (sessionUser1.toString() === user1Id && sessionUser2.toString() === user2Id) ||
        (sessionUser1.toString() === user2Id && sessionUser2.toString() === user1Id)
      );
    });

    return sessionsBetweenUsers;
  } catch (error) {
    console.error("Error fetching sessions between users:", error);
    return [];
  }
}

/**
 * Check if user has upcoming meetings or pending meeting requests
 * @param userId - The user ID to check
 * @param token - JWT token for authentication (optional)
 * @returns Promise that resolves to boolean indicating if there are upcoming/pending meetings
 */
export async function hasUpcomingOrPendingMeetings(userId: string, token?: string): Promise<boolean> {
  const cacheKey = `meeting-indicator-${userId}`;
  
  return debouncedApiService.makeRequest(
    cacheKey,
    async () => {
      const response = await fetch(`/api/meeting?userId=${userId}`, {
        headers: createAuthHeaders(token)
      });
      
      if (!response.ok) {
        console.error('Error fetching meetings:', response.status);
        return false;
      }
      
      const meetings = await response.json();
      
      if (!Array.isArray(meetings)) {
        console.error('Invalid meetings response format');
        return false;
      }
      
      const now = new Date();
      
      // Check for upcoming accepted meetings or pending meeting requests
      const hasRelevantMeetings = meetings.some((meeting: any) => {
        if (meeting.state === 'pending') return true;
        
        if (meeting.acceptStatus === true && meeting.meetingTime) {
          const meetingDate = new Date(meeting.meetingTime);
          return meetingDate > now;
        }
        
        return false;
      });
      
      return hasRelevantMeetings;
    },
    10000 // 10 second cache for indicators
  );
}
/**
 * Get count of upcoming meetings for a user
 * @param userId - The user ID
 * @param token - JWT token for authentication (optional)
 * @returns Promise that resolves to the count of upcoming meetings
 */
export async function getUpcomingMeetingsCount(userId: string, token?: string): Promise<number> {
  try {
    const response = await fetch(`/api/meeting?userId=${userId}`, {
      headers: createAuthHeaders(token)
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const meetings = await response.json();
    
    if (!Array.isArray(meetings)) {
      return 0;
    }
    
    const now = new Date();
    const upcomingMeetings = meetings.filter((meeting: any) => {
      const meetingTime = new Date(meeting.meetingTime);
      return meeting.state === 'accepted' && meetingTime > now;
    });
    
    return upcomingMeetings.length;
  } catch (error) {
    console.error("Error getting upcoming meetings count:", error);
    return 0;
  }
}

/**
 * Get count of pending meeting requests for a user
 * @param userId - The user ID
 * @param token - JWT token for authentication (optional)
 * @returns Promise that resolves to the count of pending meeting requests
 */
export async function getPendingMeetingsCount(userId: string, token?: string): Promise<number> {
  try {
    const response = await fetch(`/api/meeting?userId=${userId}`, {
      headers: createAuthHeaders(token)
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const meetings = await response.json();
    
    if (!Array.isArray(meetings)) {
      return 0;
    }
    
    const pendingMeetings = meetings.filter((meeting: any) => meeting.state === 'pending');
    
    return pendingMeetings.length;
  } catch (error) {
    console.error("Error getting pending meetings count:", error);
    return 0;
  }
}

/**
 * Invalidate cache when sessions are updated
 * @param userId - The user ID whose cache should be invalidated
 */
export function invalidateSessionCache(userId: string): void {
  debouncedApiService.invalidate(`sessions-${userId}`);
  debouncedApiService.invalidate(`session-indicator-${userId}`);
  cacheService.invalidatePattern(`sessions-${userId}`);
  cacheService.invalidatePattern(`session-indicator-${userId}`);
}

/**
 * Invalidate cache when meetings are updated
 * @param userId - The user ID whose cache should be invalidated
 */
export function invalidateMeetingCache(userId: string): void {
  debouncedApiService.invalidate(`meeting-indicator-${userId}`);
  cacheService.invalidatePattern(`meeting-indicator-${userId}`);
  cacheService.invalidatePattern(`meetings-${userId}`);
}

/**
 * Invalidate cache for both users when session/meeting involves multiple users
 * @param user1Id - First user ID
 * @param user2Id - Second user ID
 */
export function invalidateUsersCaches(user1Id: string, user2Id: string): void {
  invalidateSessionCache(user1Id);
  invalidateSessionCache(user2Id);
  invalidateMeetingCache(user1Id);
  invalidateMeetingCache(user2Id);
}