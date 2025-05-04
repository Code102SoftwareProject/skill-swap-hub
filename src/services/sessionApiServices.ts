import Session from '@/types/session';

/**
 * Fetches all sessions for a specific user
 */
export const fetchSessions = async (userId: string): Promise<Session[]> => {
  try {
    const response = await fetch(`/api/sessions?userId=${userId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch sessions');
    }

    return data.sessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

/**
 * Creates a new session between users
 */
export const createSession = async (sessionData: any): Promise<Session> => {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create session');
    }
    
    return data.session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Updates session acceptance status
 */
export const updateSessionStatus = async (sessionId: string, isAccepted: boolean): Promise<Session> => {
  try {
    const response = await fetch(`/api/sessions/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        isAccepted
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update session status');
    }
    
    return data.session;
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
};

/**
 * Updates session progress
 */
export const updateSessionProgress = async (progressId: string, updateData: any): Promise<any> => {
  try {
    const response = await fetch(`/api/sessions/progress?progressId=${progressId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update session progress');
    }
    
    return data.progress;
  } catch (error) {
    console.error('Error updating session progress:', error);
    throw error;
  }
};