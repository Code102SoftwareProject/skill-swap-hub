// File: src/lib/services/skillService.ts
import { 
  UserSkill, 
  ApiResponse, 
  NewSkillData, 
  UpdateSkillData, 
  CategoryData 
} from '@/types/userSkill';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Function to fetch all skill categories
export const getSkillCategories = async (): Promise<ApiResponse<CategoryData[]>> => {
  try {
    const response = await fetch('/api/skills/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    return { success: false, message: 'Failed to fetch skill categories' };
  }
};

// Function to fetch skills for a specific category
export const getSkillsByCategory = async (categoryId: number): Promise<ApiResponse<string[]>> => {
  try {
    const response = await fetch(`/api/skills/categories/${categoryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching skills for category ${categoryId}:`, error);
    return { success: false, message: 'Failed to fetch skills for this category' };
  }
};

// Function to fetch user skills
export const getUserSkills = async (): Promise<ApiResponse<UserSkill[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch('/api/myskills', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const apiResponse = await response.json();
    
    // Transform backend data to frontend model if needed
    if (apiResponse.success && apiResponse.data) {
      const transformedData = apiResponse.data.map((item: any) => ({
        id: item.id || item._id,
        userId: item.userId,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        skillTitle: item.skillTitle,
        proficiencyLevel: item.proficiencyLevel,
        description: item.description,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      return {
        success: true,
        message: apiResponse.message,
        data: transformedData
      };
    }
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return { success: false, message: 'Failed to fetch user skills' };
  }
};

// Function to add a new user skill
export const addUserSkill = async (skillData: NewSkillData): Promise<ApiResponse<UserSkill>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch('/api/myskills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(skillData),
    });

    const apiResponse = await response.json();
    
    // Transform the response data if needed
    if (apiResponse.success && apiResponse.data) {
      const item = apiResponse.data;
      return {
        success: true,
        message: apiResponse.message,
        data: {
          id: item.id || item._id,
          userId: item.userId,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          skillTitle: item.skillTitle,
          proficiencyLevel: item.proficiencyLevel,
          description: item.description,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }
      };
    }
    
    return apiResponse;
  } catch (error) {
    console.error('Error adding user skill:', error);
    return { success: false, message: 'Failed to add skill' };
  }
};

// Function to update a user skill - supports updating all fields
export const updateUserSkill = async (
  skillId: string, 
  updateData: UpdateSkillData
): Promise<ApiResponse<UserSkill>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    console.log('Updating skill:', skillId, 'with data:', updateData);

    const response = await fetch(`/api/myskills/${skillId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    console.log('Update response status:', response.status);

    // Handle empty responses or non-JSON responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, message: 'Skill updated successfully' };
    }

    try {
      const apiResponse = await response.json();
      console.log('Update response data:', apiResponse);
      
      // Transform the response data if needed
      if (apiResponse.success && apiResponse.data) {
        const item = apiResponse.data;
        return {
          success: true,
          message: apiResponse.message,
          data: {
            id: item.id || item._id,
            userId: item.userId,
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            skillTitle: item.skillTitle,
            proficiencyLevel: item.proficiencyLevel,
            description: item.description,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }
        };
      }
      
      return apiResponse;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      // If we can't parse JSON, check if the status code indicates success
      if (response.ok) {
        return { success: true, message: 'Skill updated successfully' };
      } else {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    console.error(`Error updating skill ${skillId}:`, error);
    return { success: false, message: 'Failed to update skill' };
  }
};

// Function to delete a user skill
export const deleteUserSkill = async (skillId: string): Promise<ApiResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    console.log('Deleting skill with ID:', skillId);
    
    const response = await fetch(`/api/myskills/${skillId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Delete response status:', response.status);
    
    // Handle empty responses or non-JSON responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, message: 'Skill deleted successfully' };
    }

    try {
      const apiResponse = await response.json();
      console.log('Delete response data:', apiResponse);
      return apiResponse;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      // If we can't parse JSON, check if the status code indicates success
      if (response.ok) {
        return { success: true, message: 'Skill deleted successfully' };
      } else {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    console.error(`Error deleting skill ${skillId}:`, error);
    return { success: false, message: 'Failed to delete skill' };
  }
};

// Function to check which skills are used in listings
export const getSkillsUsedInListings = async (): Promise<ApiResponse<string[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch('/api/myskills/used-in-listings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching skills used in listings:', error);
    return { success: false, message: 'Failed to check skills used in listings' };
  }
};