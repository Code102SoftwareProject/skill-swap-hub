/**
 * API services for handling session-related operations
 */

/**
 * Interface for creating a session
 */
interface CreateSessionData {
  user1Id: string;
  skill1Id: string;
  descriptionOfService1: string;
  user2Id: string;
  skill2Id: string;
  descriptionOfService2: string;
  dueDateUser1: string;
  dueDateUser2: string;
}

/**
 * Create a new skill exchange session
 */
export async function createSession(sessionData: CreateSessionData) {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create session');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string) {
  try {
    const response = await fetch(`/api/sessions?userId=${userId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch sessions');
    }
    
    return data.sessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
}

/**
 * Update session status (accept/reject)
 */
export async function updateSessionStatus(sessionId: string, isAccepted: boolean) {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isAccepted }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update session status');
    }
    
    return data.session;
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
}

/**
 * Update session progress
 */
export async function updateSessionProgress(progressId: string, updateData: any) {
  try {
    const response = await fetch(`/api/sessions/progress/${progressId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update session progress');
    }
    
    return data.progress;
  } catch (error) {
    console.error('Error updating session progress:', error);
    throw error;
  }
}