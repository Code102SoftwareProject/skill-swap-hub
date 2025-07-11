export interface ReportInSession {
  _id: string;
  sessionId: string;
  reportedBy: any; // User object or ID
  reportedUser: any; // User object or ID
  reason: 'not_submitting_work' | 'not_responsive' | 'poor_quality_work' | 'inappropriate_behavior' | 'not_following_session_terms' | 'other';
  description: string;
  evidenceFiles: string[];
  
  // Auto-collected data
  reportedUserLastActive?: Date;
  reportedUserWorksCount: number;
  reportingUserWorksCount: number;
  reportedUserWorksDetails: {
    workId: string;
    submissionDate: Date;
    status: 'pending' | 'accepted' | 'rejected';
  }[];
  reportingUserWorksDetails: {
    workId: string;
    submissionDate: Date;
    status: 'pending' | 'accepted' | 'rejected';
  }[];
  
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  adminResponse?: string;
  adminId?: string;
  resolvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSubmissionData {
  sessionId: string;
  reportedBy: string;
  reportedUser: string;
  reason: string;
  description: string;
  evidenceFiles?: string[];
}
