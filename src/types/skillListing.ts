// File: src/types/skillListing.ts

export interface UserDetails {
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface OfferingSkill {
  skillId?: string;
  categoryId: number;
  categoryName: string;
  skillTitle: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Expert';
  description: string;
}

export interface SeekingSkill {
  categoryId: number;
  categoryName: string;
  skillTitle: string;
}

export interface AdditionalInfo {
  description: string;
  availability?: string;
  tags?: string[] | string; // Can be array or comma-separated string
}

export interface SkillListing {
  id: string;
  userId: string;
  userDetails: UserDetails;
  offering: OfferingSkill;
  seeking: SeekingSkill;
  additionalInfo: AdditionalInfo;
  status: 'active' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

// Type for creating a new listing
export interface NewListingData {
  offering: OfferingSkill;
  seeking: SeekingSkill;
  additionalInfo: AdditionalInfo;
}

// Type for updating a listing
export interface UpdateListingData {
  offering?: OfferingSkill;
  seeking?: SeekingSkill;
  additionalInfo?: Partial<AdditionalInfo>;
  status?: 'active' | 'matched' | 'completed' | 'cancelled';
}

// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}