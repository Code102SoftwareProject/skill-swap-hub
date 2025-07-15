// User profile related types

export interface UserProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  title?: string;
  username?: string;
  bio?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  title?: string;
  bio?: string;
  location?: string;
}

// Props interface for components that use user profiles
export interface UserProfileProps {
  userId: string;
  otherUserId: string;
  onSessionUpdate?: () => void;
}
