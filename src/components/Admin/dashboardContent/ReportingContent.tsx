import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  ShieldX,
  AlertOctagon,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
// Local interfaces to ensure TypeScript compatibility
interface AdminReportUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AdminReportSession {
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

interface AdminReport {
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

interface NotificationResponse {
  success: boolean;
  message: string;
  reportId: string;
  emailsSent: {
    reporter: boolean;
    reported: boolean;
  };
}

export default function AdminReports() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmails, setSendingEmails] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(
    null
  );
  const [resolvingReport, setResolvingReport] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const createTestReport = async () => {
    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
        return;
      }

      const data = await response.json();
      alert("Test report created successfully!");
      fetchReports(); // Refresh the reports
    } catch (err) {
      console.error("Error creating test report:", err);
      alert("Failed to create test report");
    }
  };

  const debugDatabase = async () => {
    try {
      const response = await fetch("/api/admin/debug");
      const data = await response.json();
      console.log("Database debug info:", data);
      alert(
        `Database Info:\nUsers: ${data.counts?.users || 0}\nSessions: ${data.counts?.sessions || 0}\nReports: ${data.counts?.reports || 0}`
      );
    } catch (err) {
      console.error("Error fetching debug info:", err);
      alert("Failed to fetch debug info");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/reports");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched reports data:", data); // Debug log
      console.log("Sample report structure:", data[0]); // Debug log

      // More detailed debugging
      if (data.length > 0) {
        const sample = data[0];
        console.log("Report ID:", sample._id);
        console.log("Reported By:", sample.reportedBy);
        console.log("Reported User:", sample.reportedUser);
        console.log("Session ID:", sample.sessionId);
        console.log("Reason:", sample.reason);
        console.log("Description:", sample.description);
        console.log("Status:", sample.status);
        console.log("Created At:", sample.createdAt);
      }

      setReports(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching reports"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (reportId: string) => {
    if (
      !confirm(
        'Send formal investigation emails to both users?\n\n• Reported user will be asked for their side of the story\n• Reporting user will be asked for additional information\n• Both users will have 3 days to respond\n• Report status will change to "Under Review"\n\nProceed?'
      )
    ) {
      return;
    }

    try {
      setSendingEmails(reportId);

      const response = await fetch(`/api/admin/reports/${reportId}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to send notification emails"
        );
      }

      const data: NotificationResponse = await response.json();

      // Update the report in the local state
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === reportId
            ? { ...report, status: "under_review" as const }
            : report
        )
      );

      alert(
        "Investigation emails sent successfully!\n\n• Both users have been notified\n• They have 3 days to respond\n• Check your Gmail inbox for their responses\n• Report status updated to 'Under Review'"
      );
    } catch (err) {
      console.error("Error sending notification:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to send notification emails"
      );
    } finally {
      setSendingEmails(null);
    }
  };

  const handleSendNotificationToReporter = async (reportId: string) => {
    if (
      !confirm(
        "Send investigation email to the reporting user?\n\n• They will be asked for additional information\n• They will have 3 days to respond\n\nProceed?"
      )
    ) {
      return;
    }

    try {
      setSendingEmails(`${reportId}-reporter`);

      const response = await fetch(
        `/api/admin/reports/${reportId}/notify-reporter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to send notification email to reporter"
        );
      }

      alert(
        "Investigation email sent to reporting user successfully!\n\n• They have been asked for additional information\n• They have 3 days to respond\n• Check your Gmail inbox for their response"
      );
    } catch (err) {
      console.error("Error sending notification to reporter:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to send notification email to reporter"
      );
    } finally {
      setSendingEmails(null);
    }
  };

  const handleSendNotificationToReported = async (reportId: string) => {
    if (
      !confirm(
        "Send investigation email to the reported user?\n\n• They will be asked for their side of the story\n• They will have 3 days to respond\n\nProceed?"
      )
    ) {
      return;
    }

    try {
      setSendingEmails(`${reportId}-reported`);

      const response = await fetch(
        `/api/admin/reports/${reportId}/notify-reported`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            "Failed to send notification email to reported user"
        );
      }

      alert(
        "Investigation email sent to reported user successfully!\n\n• They have been asked for their side of the story\n• They have 3 days to respond\n• Check your Gmail inbox for their response"
      );
    } catch (err) {
      console.error("Error sending notification to reported user:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to send notification email to reported user"
      );
    } finally {
      setSendingEmails(null);
    }
  };

  const openEmailClient = (
    email: string | undefined,
    userType: "reporter" | "reported",
    report: AdminReport
  ) => {
    if (!email) {
      alert("No email address available for this user.");
      return;
    }

    const reporterName = formatName(
      report.reportedBy?.firstName,
      report.reportedBy?.lastName
    );
    const reportedName = formatName(
      report.reportedUser?.firstName,
      report.reportedUser?.lastName
    );
    const sessionTitle = getSessionTitle(report.sessionId);
    const reason = formatReason(report.reason);

    let subject = "";
    let body = "";

    if (userType === "reporter") {
      subject = `Investigation Required - Report #${report._id.slice(-8)}`;
      body = `Dear ${reporterName},

Thank you for reporting an incident on our platform. We are following up on your report regarding ${reportedName}.

Report Details:
- Session: ${sessionTitle}
- Reason: ${reason}
- Report ID: ${report._id}
- Date: ${formatDate(report.createdAt)}

We would appreciate if you could provide any additional information that might help us investigate this matter thoroughly. Please reply to this email with:

1. Any additional details about the incident
2. Screenshots or evidence if available
3. Any other relevant information

We take all reports seriously and will investigate this matter within 3 business days.

Best regards,
SkillSwapHub Admin Team`;
    } else {
      subject = `Investigation Notice - Report #${report._id.slice(-8)}`;
      body = `Dear ${reportedName},

We are writing to inform you that a report has been filed regarding your interaction on our platform.

Report Details:
- Session: ${sessionTitle}
- Reported by: ${reporterName}
- Reason: ${reason}
- Report ID: ${report._id}
- Date: ${formatDate(report.createdAt)}

As part of our investigation process, we would like to hear your side of the story. Please reply to this email with:

1. Your account of what happened during the session
2. Any relevant context or explanations
3. Any evidence or screenshots that support your version of events

You have 3 business days to respond to this email. We are committed to conducting a fair and thorough investigation.

Best regards,
SkillSwapHub Admin Team`;
    }

    // Create mailto link
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open the default email client
    window.location.href = mailtoLink;
  };

  const markAsResolved = async (reportId: string) => {
    if (
      !confirm(
        "Mark this report as resolved?\n\nThis action will:\n• Close the investigation\n• Update the report status to 'Resolved'\n• Save changes to database\n\nProceed?"
      )
    ) {
      return;
    }

    try {
      setResolvingReport(reportId);

      // Call the backend API to mark as resolved
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolution: "mark_resolved" }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Failed to mark report as resolved (${response.status})`
        );
      }

      const result = await response.json();
      console.log("Report resolved successfully:", result);

      // Update the report status to resolved in the local state
      setReports((prevReports) =>
        prevReports.map((r) =>
          r._id === reportId ? { ...r, status: "resolved" as const } : r
        )
      );

      alert("Report marked as resolved successfully!");
    } catch (err) {
      console.error("Error marking report as resolved:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mark report as resolved";
      alert(
        `Error: ${errorMessage}\n\nPlease check the console for more details.`
      );
    } finally {
      setResolvingReport(null);
    }
  };

  const resolveReport = async (
    reportId: string,
    resolution: "warn_reported" | "warn_reporter" | "dismiss"
  ) => {
    // For warning actions, we use the email client instead of backend API
    if (resolution === "warn_reported" || resolution === "warn_reporter") {
      const report = reports.find((r) => r._id === reportId);
      if (report) {
        const userType =
          resolution === "warn_reported" ? "reported" : "reporter";
        openWarningEmailClient(report, userType);

        const message =
          resolution === "warn_reported"
            ? "Warning email opened for reported user. Please send the email and then mark the report as resolved."
            : "Warning email opened for reporting user. Please send the email and then mark the report as resolved.";

        alert(message);
      }
      return;
    }

    // Only dismiss action calls the backend API
    const resolutionMessages = {
      dismiss: "Dismiss the report (no action needed)",
    };

    if (
      !confirm(
        `Are you sure you want to ${resolutionMessages[resolution]}?\n\nThis action will:\n• Update the report status to "resolved"\n• Close the investigation\n\nProceed?`
      )
    ) {
      return;
    }

    try {
      setResolvingReport(reportId);

      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolution }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("API Error Response:", errorData);
        throw new Error(
          errorData.message ||
            errorData.error ||
            `Failed to resolve report (${response.status})`
        );
      }

      const result = await response.json();
      console.log("Report resolved successfully:", result);

      // Update the report in the local state
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === reportId
            ? { ...report, status: "resolved" as const }
            : report
        )
      );

      alert("Report dismissed! No further action required.");
    } catch (err) {
      console.error("Error resolving report:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to resolve report";
      alert(
        `Error: ${errorMessage}\n\nPlease check the console for more details.`
      );
    } finally {
      setResolvingReport(null);
    }
  };

  const openWarningEmailClient = (
    report: AdminReport,
    userType: "reporter" | "reported"
  ) => {
    const email =
      userType === "reporter"
        ? report.reportedBy?.email
        : report.reportedUser?.email;

    if (!email) {
      alert(
        `No email address available for the ${userType === "reporter" ? "reporting" : "reported"} user.`
      );
      return;
    }

    const reporterName = formatName(
      report.reportedBy?.firstName,
      report.reportedBy?.lastName
    );
    const reportedName = formatName(
      report.reportedUser?.firstName,
      report.reportedUser?.lastName
    );
    const sessionTitle = getSessionTitle(report.sessionId);
    const reason = formatReason(report.reason);

    let subject = "";
    let body = "";

    if (userType === "reported") {
      subject = `Warning: Platform Rules Violation - Report #${report._id.slice(-8)}`;
      body = `Dear ${reportedName},

Following our investigation of a report filed against you, we have determined that your behavior during a session violated our platform guidelines.

Report Details:
- Session: ${sessionTitle}
- Reported by: ${reporterName}
- Reason: ${reason}
- Report ID: ${report._id}
- Date: ${formatDate(report.createdAt)}

This serves as an official warning. Please review our community guidelines and ensure your future interactions comply with our platform standards.

Repeated violations may result in account restrictions or suspension.

If you believe this warning was issued in error, please reply to this email with your explanation within 7 days.

Best regards,
SkillSwapHub Admin Team`;
    } else {
      subject = `Warning: False Complaint Filed - Report #${report._id.slice(-8)}`;
      body = `Dear ${reporterName},

Following our investigation of the report you filed, we have determined that your complaint appears to be unfounded or exaggerated.

Report Details:
- Session: ${sessionTitle}
- Reported user: ${reportedName}
- Reason claimed: ${reason}
- Report ID: ${report._id}
- Date: ${formatDate(report.createdAt)}

Our investigation found insufficient evidence to support your claims. Filing false or misleading reports undermines our platform's integrity and wastes administrative resources.

This serves as an official warning. Please ensure that future reports are accurate and made in good faith.

Repeated false reporting may result in account restrictions.

If you have additional evidence to support your original claim, please reply to this email within 7 days.

Best regards,
SkillSwapHub Admin Team`;
    }

    // Create mailto link
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open the default email client
    window.location.href = mailtoLink;
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "under_review":
        return "default";
      case "resolved":
        return "secondary";
      case "dismissed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "under_review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "dismissed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionTitle = (session: AdminReport["sessionId"]) => {
    console.log("Session data:", session); // Debug log
    if (!session) {
      console.log("No session data available");
      return "Session Not Available";
    }
    if (!session.descriptionOfService1 && !session.descriptionOfService2) {
      console.log("Session missing service descriptions:", session);
      return `Session ${session._id?.slice(-8) || "Unknown"}`;
    }
    return `${session.descriptionOfService1 || "Unknown Service"} ↔ ${session.descriptionOfService2 || "Unknown Service"}`;
  };

  const formatReason = (reason: string) => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatName = (
    firstName: string | undefined,
    lastName: string | undefined
  ) => {
    const formatNamePart = (name: string) => {
      return name.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formattedFirst = firstName ? formatNamePart(firstName) : "Unknown";
    const formattedLast = lastName ? formatNamePart(lastName) : "User";

    return `${formattedFirst} ${formattedLast}`;
  };

  // Filter reports based on status and search query
  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        // Status filter
        const statusMatch =
          statusFilter === "all" || report.status === statusFilter;

        // Search filter
        if (!searchQuery.trim()) {
          return statusMatch;
        }

        const query = searchQuery.toLowerCase();
        const reporterName = formatName(
          report.reportedBy?.firstName,
          report.reportedBy?.lastName
        ).toLowerCase();
        const reportedName = formatName(
          report.reportedUser?.firstName,
          report.reportedUser?.lastName
        ).toLowerCase();
        const reporterEmail = (report.reportedBy?.email || "").toLowerCase();
        const reportedEmail = (report.reportedUser?.email || "").toLowerCase();
        const reason = formatReason(report.reason).toLowerCase();
        const description = (report.description || "").toLowerCase();
        const reportId = report._id.toLowerCase();

        const searchMatch =
          reporterName.includes(query) ||
          reportedName.includes(query) ||
          reporterEmail.includes(query) ||
          reportedEmail.includes(query) ||
          reason.includes(query) ||
          description.includes(query) ||
          reportId.includes(query);

        return statusMatch && searchMatch;
      })
      .sort((a, b) => {
        // Sort by creation date
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();

        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [reports, statusFilter, searchQuery, sortDirection]);

  // Get counts for each status
  const getStatusCounts = () => {
    const counts = {
      all: reports.length,
      pending: 0,
      under_review: 0,
      resolved: 0,
      dismissed: 0,
    };

    reports.forEach((report) => {
      if (counts.hasOwnProperty(report.status)) {
        counts[report.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // Report status constants for dropdown menu
  const REPORT_STATUSES = {
    ALL: "all",
    PENDING: "pending",
    UNDER_REVIEW: "under_review",
    RESOLVED: "resolved",
    DISMISSED: "dismissed",
  } as const;

  type ReportStatusKey = keyof typeof REPORT_STATUSES;

  // Format status for display
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case REPORT_STATUSES.ALL:
        return "All";
      case REPORT_STATUSES.PENDING:
        return "Pending";
      case REPORT_STATUSES.UNDER_REVIEW:
        return "Under Review";
      case REPORT_STATUSES.RESOLVED:
        return "Resolved";
      case REPORT_STATUSES.DISMISSED:
        return "Dismissed";
      default:
        return status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading reports...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error Loading Reports
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchReports} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Reports Dashboard
            </CardTitle>
            <p className="text-gray-600 mt-1">
              Manage and review user reports across all sessions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              {searchQuery ? (
                <>
                  Showing {filteredReports.length} of {reports.length} reports
                  {statusFilter !== "all" && ` (${formatStatus(statusFilter)})`}
                </>
              ) : (
                <>
                  Total: {filteredReports.length} reports
                  {statusFilter !== "all" && ` (${formatStatus(statusFilter)})`}
                </>
              )}
            </div>
            <Button onClick={fetchReports} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search reports by name, email, reason, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Filter by Status:
                  </h3>
                  <select
                    className="border px-4 py-2 rounded"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {(
                      Object.keys(REPORT_STATUSES) as Array<ReportStatusKey>
                    ).map((key) => (
                      <option key={key} value={REPORT_STATUSES[key]}>
                        {getStatusDisplayName(REPORT_STATUSES[key])} (
                        {
                          statusCounts[
                            REPORT_STATUSES[key] as keyof typeof statusCounts
                          ]
                        }
                        )
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Sort direction toggle button */}
                <button
                  onClick={toggleSortDirection}
                  className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
                  title={
                    sortDirection === "desc"
                      ? "Showing newest first"
                      : "Showing oldest first"
                  }
                  aria-label={`Sort by date: currently ${sortDirection === "desc" ? "newest first" : "oldest first"}`}
                >
                  {sortDirection === "desc" ? (
                    <>
                      <SortDesc className="h-4 w-4" /> Newest
                    </>
                  ) : (
                    <>
                      <SortAsc className="h-4 w-4" /> Oldest
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {reports.length === 0
                  ? "No Reports Found"
                  : searchQuery
                    ? `No Results Found`
                    : `No ${formatStatus(statusFilter)} Reports`}
              </h3>
              <p className="text-gray-600 mb-4">
                {reports.length === 0
                  ? "All user reports will appear here when submitted"
                  : searchQuery
                    ? `No reports match your search "${searchQuery}". Try adjusting your search terms or filters.`
                    : `No reports with status "${formatStatus(statusFilter)}" found. Try selecting a different filter.`}
              </p>
              {reports.length === 0 && (
                <div className="space-x-2">
                  <Button
                    onClick={createTestReport}
                    variant="outline"
                    size="sm"
                  >
                    Create Test Report
                  </Button>
                  <Button onClick={debugDatabase} variant="outline" size="sm">
                    Debug Database
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Reporting User</th>
                    <th className="px-4 py-2 text-left">Reported User</th>
                    <th className="px-4 py-2 text-left">Reason</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">
                      <div className="flex items-center">
                        <span>Created At</span>
                        <button
                          onClick={toggleSortDirection}
                          className="ml-2 p-1 rounded hover:bg-gray-200"
                          title={`Sort by date ${sortDirection === "asc" ? "descending" : "ascending"}`}
                        >
                          {sortDirection === "asc" ? (
                            <svg
                              className="w-4 h-4 text-gray-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4 text-gray-500"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 15l-4 4-4-4m0-6l4-4 4 4"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report._id} className="bg-white hover:bg-gray-50">
                      <td className="px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatName(
                                report.reportedBy?.firstName,
                                report.reportedBy?.lastName
                              )}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {report.reportedBy?.email || "No email available"}
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              openEmailClient(
                                report.reportedBy?.email,
                                "reporter",
                                report
                              )
                            }
                            disabled={!report.reportedBy?.email}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 ml-2"
                            title="Open email client to send message to reporting user"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatName(
                                report.reportedUser?.firstName,
                                report.reportedUser?.lastName
                              )}
                            </div>
                            <div className="text-gray-500 text-sm">
                              {report.reportedUser?.email ||
                                "No email available"}
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              openEmailClient(
                                report.reportedUser?.email,
                                "reported",
                                report
                              )
                            }
                            disabled={!report.reportedUser?.email}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 ml-2"
                            title="Open email client to send message to reported user"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="text-sm font-medium text-gray-900">
                          {formatReason(report.reason)}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="flex items-center justify-start">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                          >
                            {formatStatus(report.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="text-sm text-gray-900">
                          {formatDate(report.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>

                          {report.status === "pending" && (
                            <button
                              onClick={() => handleSendNotification(report._id)}
                              disabled={sendingEmails === report._id}
                              className={`p-2 rounded ${
                                sendingEmails === report._id
                                  ? "bg-blue-200 text-blue-700 cursor-not-allowed"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              }`}
                              title="Send investigation emails to both users"
                            >
                              {sendingEmails === report._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                            </button>
                          )}

                          {report.status === "under_review" && (
                            <>
                              <button
                                onClick={() =>
                                  openWarningEmailClient(report, "reported")
                                }
                                disabled={!report.reportedUser?.email}
                                className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded"
                                title="Open email to warn reported user (complaint is valid)"
                              >
                                <AlertOctagon className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() =>
                                  openWarningEmailClient(report, "reporter")
                                }
                                disabled={!report.reportedBy?.email}
                                className="p-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded"
                                title="Open email to warn reporting user (false complaint)"
                              >
                                <ShieldX className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() =>
                                  resolveReport(report._id, "dismiss")
                                }
                                disabled={resolvingReport === report._id}
                                className={`p-2 rounded ${
                                  resolvingReport === report._id
                                    ? "bg-gray-200 text-gray-700 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                                title="Dismiss report (no action needed)"
                              >
                                {resolvingReport === report._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => markAsResolved(report._id)}
                                disabled={resolvingReport === report._id}
                                className={`p-2 rounded flex items-center gap-1 ${
                                  resolvingReport === report._id
                                    ? "bg-green-200 text-green-700 cursor-not-allowed"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                }`}
                                title="Mark report as resolved (after sending warning email)"
                              >
                                {resolvingReport === report._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                Resolve
                              </button>
                            </>
                          )}

                          {report.status === "resolved" && (
                            <button
                              className="p-2 bg-green-100 text-green-700 rounded cursor-default opacity-70"
                              disabled
                              title="Report has been resolved"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex flex-col space-y-1.5 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold leading-none tracking-tight text-gray-900">
                  Report Details
                </h2>
                <Button
                  onClick={() => setSelectedReport(null)}
                  variant="outline"
                  size="sm"
                  className="hover:bg-gray-100"
                >
                  ✕ Close
                </Button>
              </div>
            </div>

            <div className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                    👤 Reporting User
                  </h4>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-medium text-base">
                      {formatName(
                        selectedReport.reportedBy?.firstName,
                        selectedReport.reportedBy?.lastName
                      )}
                    </p>
                    <p className="text-gray-600 text-sm">
                      📧{" "}
                      {selectedReport.reportedBy?.email || "No email available"}
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                    🚨 Reported User
                  </h4>
                  <div className="space-y-1">
                    <p className="text-gray-900 font-medium text-base">
                      {formatName(
                        selectedReport.reportedUser?.firstName,
                        selectedReport.reportedUser?.lastName
                      )}
                    </p>
                    <p className="text-gray-600 text-sm">
                      📧{" "}
                      {selectedReport.reportedUser?.email ||
                        "No email available"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                  🔄 Session Details
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">
                    {getSessionTitle(selectedReport.sessionId)}
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Session ID:</strong>{" "}
                      {selectedReport.sessionId?._id || "Not Available"}
                    </p>
                    {selectedReport.sessionId?.descriptionOfService1 && (
                      <p>
                        <strong>Service 1:</strong>{" "}
                        {selectedReport.sessionId.descriptionOfService1}
                      </p>
                    )}
                    {selectedReport.sessionId?.descriptionOfService2 && (
                      <p>
                        <strong>Service 2:</strong>{" "}
                        {selectedReport.sessionId.descriptionOfService2}
                      </p>
                    )}
                    {!selectedReport.sessionId && (
                      <p className="text-red-600 italic">
                        ⚠️ Session data not available or not populated
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                  ⚠️ Report Reason
                </h4>
                <p className="text-gray-900 font-medium">
                  {formatReason(selectedReport.reason)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                  📝 Detailed Description
                </h4>
                <div className="bg-white p-4 rounded border border-gray-200 min-h-[100px]">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedReport.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Current Status
                  </h4>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(selectedReport.status)} font-medium text-sm px-3 py-1`}
                  >
                    {formatStatus(selectedReport.status)}
                  </Badge>
                </div>
                <div className="text-right">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    📅 Report Submitted
                  </h4>
                  <p className="text-gray-700 font-medium">
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>
              </div>

              {/* Resolution Actions */}
              {selectedReport.status === "under_review" && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                    🎯 Resolve Report
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Choose the appropriate resolution based on your
                    investigation:
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setSelectedReport(null);
                        openWarningEmailClient(selectedReport, "reported");
                      }}
                      disabled={!selectedReport.reportedUser?.email}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <AlertOctagon className="h-4 w-4 mr-2" />
                      🛑 Open Email to Warn Reported User (Complaint is Valid)
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedReport(null);
                        openWarningEmailClient(selectedReport, "reporter");
                      }}
                      disabled={!selectedReport.reportedBy?.email}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-yellow-200"
                    >
                      <ShieldX className="h-4 w-4 mr-2" />
                      ⚠️ Open Email to Warn Reporting User (False Complaint)
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedReport(null);
                        resolveReport(selectedReport._id, "dismiss");
                      }}
                      disabled={resolvingReport === selectedReport._id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Dismiss Report (No Action Needed)
                    </Button>
                    <div className="border-t border-gray-200 my-3"></div>
                    <Button
                      onClick={() => {
                        setSelectedReport(null);
                        markAsResolved(selectedReport._id);
                      }}
                      disabled={resolvingReport === selectedReport._id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />✅ Mark as
                      Resolved (After Sending Warning Email)
                    </Button>
                  </div>
                </div>
              )}

              {selectedReport.status === "resolved" && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Report Resolved
                  </h4>
                  <p className="text-green-800 text-sm">
                    This report has been successfully resolved and appropriate
                    action has been taken.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
