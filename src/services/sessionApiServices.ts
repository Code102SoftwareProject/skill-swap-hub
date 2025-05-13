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
 * API service functions for skills
 */

export interface Skill {
  id: string;
  skillTitle: string;
  proficiencyLevel: string;
  description: string;
  categoryName: string;
  isVerified?: boolean;
}

/**
 * Fetch skills for a specific user
 */
export async function getUserSkills(userId: string): Promise<Skill[]> {
  try {
    console.log(`Fetching skills for user: ${userId}`);
    
    // Add a cache-busting parameter to avoid stale data
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/userskillfetch?userId=${userId}&t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from skills API: ${errorText}`);
      throw new Error(`Failed to fetch skills for user ${userId}: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Skills data received for user ${userId}`);
    
    // Transform the API response into a flat array of skills
    if (data.success && data.categories) {
      const skills: Skill[] = [];
      
      data.categories.forEach((category: any) => {
        category.skills.forEach((skill: any) => {
          skills.push({
            id: skill.id,
            skillTitle: skill.skillTitle,
            proficiencyLevel: skill.proficiencyLevel,
            description: skill.description,
            categoryName: category.categoryName,
            isVerified: skill.isVerified || false
          });
        });
      });
      
      console.log(`Processed ${skills.length} skills for user ${userId}`);
      return skills;
    }
    
    console.log(`No skills found for user ${userId}`);
    return [];
  } catch (error) {
    console.error(`Error fetching skills for user ${userId}:`, error);
    throw error;
  }
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

/**
 * Fetch a user's profile information
 */
export async function getSessionUserProfile(userId: string) {
  try {
    const response = await fetch(`/api/users/profile?id=${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.user) {
      return {
        id: userId,
        name: `${data.user.firstName} ${data.user.lastName}`,
        profileImage: data.user.avatar || '/default-avatar.png',
        firstName: data.user.firstName,
        lastName: data.user.lastName
      };
    }
    
    throw new Error('User profile not found');
  } catch (error) {
    console.error(`Error fetching user profile for ${userId}:`, error);
    return null;
  }
}