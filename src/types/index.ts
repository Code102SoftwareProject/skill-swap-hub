// Re-export all types for easier importing
export * from './session';
export * from './work';
export * from './ui';
export * from './review';
export * from './cancellation';
export * from './counterOffer';
export * from './user';
export * from './report';
export * from './notification';
export * from './chat';
export * from './meeting';
export * from './skillListing';
export * from './skillMatch';
export * from './adminReports';

// Re-export userSkill types with explicit handling of ApiResponse conflict
export type {
  UserSkill,
  NewSkillData,
  UpdateSkillData,
  CategoryData
} from './userSkill';

// Export ApiResponse from userSkill with an alias to avoid conflict
export type { ApiResponse as UserSkillApiResponse } from './userSkill';
