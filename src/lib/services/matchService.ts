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