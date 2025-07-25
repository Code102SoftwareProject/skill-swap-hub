import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Filters } from "./reporting/Filters";
import { ReportsTable } from "./reporting/ReportsTable";
import type { EmailFlow } from "./reporting/types";
import { ReportDetailsModal } from "./reporting/ReportDetailsModal";

import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
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
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  /**
   * Download an evidence file from the server
   * @param fileUrl URL of the file to download
   * @param reportId Report ID to use in the downloaded filename
   */
  const downloadEvidence = async (fileUrl: string, reportId: string) => {
    const downloadKey = `${fileUrl}-${reportId}`;

    // Prevent duplicate downloads
    if (downloading[downloadKey]) return;

    try {
      // Set loading state for this specific download
      setDownloading((prev) => ({
        ...prev,
        [downloadKey]: true,
      }));

      const toastId = toast.loading("Downloading evidence file...");
      console.log("Downloading evidence file from URL:", fileUrl);

      const response = await fetch(
        `/api/file/retrieve?fileUrl=${encodeURIComponent(fileUrl)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Download error:", errorData);
        throw new Error(errorData.message || "Failed to download file");
      }

      // Determine file type and create appropriate filename
      const contentType = response.headers.get("content-type") || "";
      const fileExtension = getFileExtensionFromMimeType(contentType);
      const originalFileName = fileUrl.split("/").pop() || "evidence";
      const downloadFileName = `Evidence-${reportId.slice(-8)}-${originalFileName}.${fileExtension}`;

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Create and trigger a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", downloadFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("Evidence file downloaded successfully");
    } catch (err) {
      console.error("Error downloading evidence file:", err);
      toast.dismiss();
      toast.error(
        err instanceof Error ? err.message : "Failed to download evidence file"
      );
    } finally {
      // Reset loading state for this download
      setDownloading((prev) => ({
        ...prev,
        [downloadKey]: false,
      }));
    }
  };

  /**
   * Convert MIME type to file extension
   * @param mimeType Content type from HTTP header
   * @returns Appropriate file extension
   */
  const getFileExtensionFromMimeType = (mimeType: string): string => {
    const mimeToExtMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "application/pdf": "pdf",
      "text/plain": "txt",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/zip": "zip",
      "application/x-zip-compressed": "zip",
    };

    // Extract the main MIME type (before any semicolon)
    const mainMimeType = mimeType.split(";")[0].trim();
    return mimeToExtMap[mainMimeType] || "bin";
  };

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
      const res = await fetch("/api/admin/reports");
      if (!res.ok) {
        const errorText = await res.text();
        console.error("🔴 API /admin/reports error body:", errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (reportId: string) => {
    // single, concise confirmation
    if (!window.confirm(
      'Have you sent email to both parties?\n\nThe report’s status will now change to "Under Review".'
    )) {
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

     
      toast.success('Status updated to Under Review');
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
    if (resolution === "warn_reported" || resolution === "warn_reporter") {
      // map your underscore‐style resolution to the hyphen‐style EmailFlow
      const flow: EmailFlow =
        resolution === "warn_reported" ? "warn-reported" : "warn-reporter";

      // 1) Look up the full AdminReport object by its ID
      const rpt = reports.find((r) => r._id === reportId);
      if (!rpt) {
        console.warn("Could not find report with id", reportId);
        return;
      }

      // 2) Call the email‐flow helper with the real report object
      openWarningEmailClient(rpt, flow);

      // 3) Let the admin know which warning was opened
      alert(
        flow === "warn-reported"
          ? "Warning email opened for reported user…"
          : "Warning email opened for reporting user…"
      );
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
            ? {
                ...report,
                status: resolution === "dismiss" ? "dismissed" : "resolved",
              }
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

  /** Kick off any of the four email flows:
   *  - initial-reporter
   *  - initial-reported
   *  - warn-reporter
   *  - warn-reported
   */
  const openWarningEmailClient = (report: AdminReport, flow: EmailFlow) => {
    const reporterEmail = report.reportedBy?.email;
    const reportedEmail = report.reportedUser?.email;
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

    let email: string | undefined;
    let subject = "";
    let body = "";

    switch (flow) {
      case "initial-reporter":
        email = reporterEmail;
        subject = `Investigation Required – Report #${report._id.slice(-8)}`;
        body = `Dear ${reporterName},\n\nThank you for your report about ${reportedName}. We’ve started investigating the reported user. Please reply with any additional details or evidence you might have.\n\nBest,\nAdmin Team`;
        break;
      case "initial-reported":
        email = reportedEmail;
        subject = `Investigation Notice – Report #${report._id.slice(-8)}`;
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
        break;
      case "warn-reporter":
        email = reporterEmail;
        subject = `Warning: False Complaint – Report #${report._id.slice(-8)}`;
        body = `Dear ${reporterName},\n\nOur investigation found insufficient evidence to support your report. Please refrain from filing false reports.\n\nBest,\nAdmin Team`;
        break;
      case "warn-reported":
        email = reportedEmail;
        subject = `Warning: Violation – Report #${report._id.slice(-8)}`;
        body = `Dear ${reportedName},\n\nWe confirmed your behavior violated our guidelines. This is an official warning.\n\nBest,\nAdmin Team`;
        break;
    }

    if (!email) {
      alert("No email address available for this user.");
      return;
    }

    window.location.href = [
      `mailto:${encodeURIComponent(email)}`,
      `?subject=${encodeURIComponent(subject)}`,
      `&body=${encodeURIComponent(body)}`,
    ].join("");
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

  //  new: options for our Filters dropdown
  const statusOptions = [
    { value: "all", label: "All", count: statusCounts.all },
    { value: "pending", label: "Pending", count: statusCounts.pending },
    {
      value: "under_review",
      label: "Under Review",
      count: statusCounts.under_review,
    },
    { value: "resolved", label: "Resolved", count: statusCounts.resolved },
    { value: "dismissed", label: "Dismissed", count: statusCounts.dismissed },
  ];

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
    <div className="space-y-6  text-gray-900 dark:text-gray-900">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-900">
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
          {/* unified search + status + sort UI */}
          <Filters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sortDirection={sortDirection}
            onToggleSort={toggleSortDirection}
            statusOptions={statusOptions}
          />

          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              {/* …your existing “no results” UI… */}
            </div>
          ) : (
            <ReportsTable
              reports={filteredReports}
              sortDirection={sortDirection}
              onToggleSort={toggleSortDirection}
              downloading={downloading}
              onDownloadEvidence={downloadEvidence}
              sendingEmails={sendingEmails}
              onSendNotification={handleSendNotification}
              onSendNotificationToReporter={handleSendNotificationToReporter}
              onSendNotificationToReported={handleSendNotificationToReported}
              onOpenWarningEmail={openWarningEmailClient}
              resolvingReport={resolvingReport}
              onResolve={resolveReport}
              onMarkResolved={markAsResolved}
              onViewDetails={setSelectedReport}
              formatName={formatName}
              formatReason={formatReason}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
            />
          )}
        </CardContent>
      </Card>

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolve={resolveReport}
          onMarkResolved={markAsResolved}
          openWarningEmail={openWarningEmailClient}
          downloadEvidence={downloadEvidence}
          downloading={downloading}
          formatName={formatName}
          formatDate={formatDate}
          formatReason={formatReason}
          getSessionTitle={getSessionTitle}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
}
