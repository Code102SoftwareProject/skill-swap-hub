// File: src/types/skillMatch.ts

// Type for skill match
export interface SkillMatch {
    id: string;
    matchPercentage: number;  // 50 for partial, 100 for exact
    matchType: 'exact' | 'partial';
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    createdAt: string;
    updatedAt?: string;
    
    // Current user's perspective - populated by the API
    myDetails: {
      firstName: string;
      lastName: string;
      avatar?: string;
      offeringSkill: string;
      seekingSkill: string;
    };
    myListingId: string;
    
    // Other user's details - populated by the API
    otherUser: {
      userId: string;
      listingId: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      offeringSkill: string;
      seekingSkill: string;
    };
  }
  
  // Types for match status changes
  export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
  
  // Type for the filters
  export interface MatchFilters {
    matchType?: 'exact' | 'partial';
    status?: MatchStatus;
  }