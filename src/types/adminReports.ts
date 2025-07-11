export interface AdminReportUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AdminReportSession {
  _id: string;
  user1Id: string;
  user2Id: string;
  skill1Id: string;
  skill2Id: string;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  status: string;
}

export interface AdminReport {
  _id: string;
  sessionId: AdminReportSession | null;
  reportedBy: AdminReportUser | null;
  reportedUser: AdminReportUser | null;
  reason:
    | "not_submitting_work"
    | "not_responsive"
    | "poor_quality_work"
    | "inappropriate_behavior"
    | "not_following_session_terms"
    | "other";
  description: string;
  evidenceFiles: string[];

  // Auto-collected data
  reportedUserLastActive?: string;
  reportedUserWorksCount: number;
  reportingUserWorksCount: number;
  reportedUserWorksDetails: {
    workId: string;
    submissionDate: string;
    status: "pending" | "accepted" | "rejected";
  }[];
  reportingUserWorksDetails: {
    workId: string;
    submissionDate: string;
    status: "pending" | "accepted" | "rejected";
  }[];

  status: "pending" | "under_review" | "resolved" | "dismissed";
  adminResponse?: string;
  adminId?: string;
  resolvedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  reportId: string;
  emailsSent: {
    reporter: boolean;
    reported: boolean;
  };
}
