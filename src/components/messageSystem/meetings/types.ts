export interface Meeting {
  _id: string;
  senderId: string;
  receiverId: string;
  description: string;
  sentAt: Date;
  meetingTime: Date;
  meetingLink: string | null;
  acceptStatus: boolean;
  state: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
}

export interface UserProfile {
  firstName: string;
  lastName: string;
}

export interface UserProfiles {
  [key: string]: UserProfile;
}