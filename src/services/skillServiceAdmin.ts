// Service to fetch another user's skills by userId (for admin or cross-user lookups)
import { ApiResponse, UserSkill } from '@/types/userSkill';

export const getUserSkillsByUserId = async (userId: string): Promise<ApiResponse<UserSkill[]>> => {
  try {
    const response = await fetch(`/api/userskillfetch?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const apiResponse = await response.json();
    if (apiResponse.success && apiResponse.categories) {
      // Flatten all skills from all categories
      const allSkills = apiResponse.categories.flatMap((cat: any) => cat.skills.map((s: any) => ({
        ...s,
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
      })));
      return { success: true, data: allSkills };
    }
    return { success: false, message: apiResponse.message || 'Failed to fetch user skills' };
  } catch (error) {
    console.error('Error fetching user skills by userId:', error);
    return { success: false, message: 'Failed to fetch user skills' };
  }
};
