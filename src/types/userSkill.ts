// File: src/types/userSkill.ts
// This is a frontend-specific model that matches what comes from the API

export interface UserSkill {
  id: string;  // This will hold the MongoDB _id that comes from the backend
  userId: string;
  categoryId: number;
  categoryName: string;
  skillTitle: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Expert';
  description: string;
  createdAt: string;
  updatedAt?: string;
}

// Type for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Interface for new skill data
export interface NewSkillData {
  categoryId: number;
  categoryName: string;
  skillTitle: string;
  proficiencyLevel: string;
  description: string;
}

// Interface for skill update data - now includes all fields as required
export interface UpdateSkillData {
  categoryId: number;      // Now required
  categoryName: string;    // Now required
  skillTitle: string;      // Now required
  proficiencyLevel: string;
  description: string;
}

// Interface for category data
export interface CategoryData {
  categoryId: number;
  categoryName: string;
}