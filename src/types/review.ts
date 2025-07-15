// Review-related types

export interface Review {
  _id: string;
  sessionId: string;
  reviewerId: any; // User who wrote the review
  reviewedUserId: any; // User being reviewed
  rating: number; // 1-5 scale
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSubmissionData {
  sessionId: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  comment: string;
}
