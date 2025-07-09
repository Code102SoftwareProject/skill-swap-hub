// File: src/services/trendingService.ts
import { ApiResponse } from '@/types/userSkill';

// Interface for trending skill data
export interface TrendingSkill {
  skillName: string;
  matchCount: number;
  trendScore: number;
  percentage: string;
}

export interface TrendingSkillsResponse {
  data: TrendingSkill[];
  totalMatches: number;
  generatedAt: string;
}

// Function to fetch trending skills (public endpoint)
export const getTrendingSkills = async (limit: number = 10): Promise<ApiResponse<TrendingSkill[]>> => {
  try {
    const response = await fetch(`/api/skills/trending?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data for trending skills
    });

    const apiResponse = await response.json();
    
    if (apiResponse.success) {
      return {
        success: true,
        message: 'Trending skills fetched successfully',
        data: apiResponse.data,
        meta: {
          totalMatches: apiResponse.totalMatches,
          generatedAt: apiResponse.generatedAt
        }
      };
    }
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching trending skills:', error);
    return { 
      success: false, 
      message: 'Failed to fetch trending skills' 
    };
  }
};

// Function to get skills used in matches (authenticated endpoint)
export const getSkillsUsedInMatches = async (): Promise<ApiResponse<any>> => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch('/api/myskills/used-in-matches', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching skills used in matches:', error);
    return { 
      success: false, 
      message: 'Failed to fetch skills used in matches' 
    };
  }
};