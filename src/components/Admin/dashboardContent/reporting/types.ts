// src/components/Admin/dashboardContent/reporting/types.ts

/**
 * A user who either reported or was reported.
 */
export interface AdminReportUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * The session in which the report was filed.
 */
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

/**
 * The shape of a report.
 */
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

  // Auto‐collected
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

/**
 * All four email‐flow modes:
 *  • initial-reporter  – ask the reporter for more info
 *  • initial-reported  – ask the reported user for their side
 *  • warn-reporter     – warn the reporter (“false complaint”)
 *  • warn-reported     – warn the reported user (“violation”)
 */
export type EmailFlow =
  | "initial-reporter"
  | "initial-reported"
  | "warn-reporter"
  | "warn-reported";

/**
 * Props for the ReportsTable component.
 */
export interface ReportsTableProps {
  /** Which reports to render */
  reports: AdminReport[];

  /** "asc" or "desc" */
  sortDirection: "asc" | "desc";
  onToggleSort: () => void;

  downloading: Record<string, boolean>;
  onDownloadEvidence: (fileUrl: string, reportId: string) => Promise<void>;

  sendingEmails: string | null;
  onSendNotification: (reportId: string) => Promise<void>;
  onSendNotificationToReporter: (reportId: string) => Promise<void>;
  onSendNotificationToReported: (reportId: string) => Promise<void>;

  /** Kick off any of the four email flows */
  onOpenWarningEmail: (report: AdminReport, flow: EmailFlow) => void;

  resolvingReport: string | null;
  onResolve: (
    reportId: string,
    resolution: "dismiss"
  ) => Promise<void>;
  onMarkResolved: (reportId: string) => Promise<void>;

  onViewDetails: (report: AdminReport) => void;

  formatName: (first: string | undefined, last: string | undefined) => string;
  formatReason: (reason: string) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: AdminReport["status"]) => string;
}
