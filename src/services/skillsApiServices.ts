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
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch skills for user ${userId}: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Skills data for user ${userId}:`, data);
    
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
      
      console.log(`Transformed ${skills.length} skills for user ${userId}`);
      return skills;
    }
    
    console.log(`No skills found for user ${userId}`);
    return [];
  } catch (error) {
    console.error(`Error fetching skills for user ${userId}:`, error);
    throw error;
  }
}