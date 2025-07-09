// File: src/lib/services/matchService.ts
import { ApiResponse } from '@/types/userSkill';
import { SkillMatch } from '@/types/skillMatch';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Function to find new matches
export const findMatches = async (): Promise<ApiResponse<SkillMatch[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch('/api/matches/find', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error finding matches:', error);
    return { success: false, message: 'Failed to find matches' };
  }
};

// Function to get user's matches
export const getMatches = async (
  matchType?: 'exact' | 'partial',
  status?: 'pending' | 'accepted' | 'rejected' | 'completed'
): Promise<ApiResponse<SkillMatch[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    // Build query string
    let url = '/api/matches';
    const params = new URLSearchParams();
    
    if (matchType) {
      params.append('matchType', matchType);
    }
    
    if (status) {
      params.append('status', status);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error);
    return { success: false, message: 'Failed to fetch matches' };
  }
};

// Function to get a specific match
export const getMatch = async (matchId: string): Promise<ApiResponse<SkillMatch>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch(`/api/matches/${matchId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching match ${matchId}:`, error);
    return { success: false, message: 'Failed to fetch match details' };
  }
};

// Function to update match status
export const updateMatchStatus = async (
  matchId: string,
  status: 'accepted' | 'rejected' | 'completed'
): Promise<ApiResponse<SkillMatch>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch(`/api/matches/${matchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    return await response.json();
  } catch (error) {
    console.error(`Error updating match ${matchId}:`, error);
    return { success: false, message: 'Failed to update match status' };
  }
};

// Function to accept match and create chat room
export const acceptMatchAndCreateChatRoom = async (matchId: string): Promise<ApiResponse<any>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch('/api/matches/accept', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ matchId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error accepting match and creating chat room:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to accept match and create chat room' 
    };
  }
};

// Function to create chat room between two users (keep for other use cases)
export const createChatRoom = async (participants: string[]): Promise<ApiResponse<any>> => {
  try {
    if (!participants || participants.length !== 2) {
      return { success: false, message: 'Exactly two participants required' };
    }

    const response = await fetch('/api/chatrooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_SYSTEM_API_KEY || '',
      },
      body: JSON.stringify({ participants }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { 
      success: data.success, 
      message: data.success ? 'Chat room created successfully' : data.message,
      data: data.chatRoom 
    };
  } catch (error) {
    console.error('Error creating chat room:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create chat room' 
    };
  }
};