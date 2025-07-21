// src/components/Admin/dashboardContent/reporting/ReportDetailsModal.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertOctagon,
  ShieldX,
  X,
  CheckCircle,
  Download,
  Loader2,
} from "lucide-react";
import type { AdminReport, EmailFlow } from "./types";

// String constants for all user-visible text
const MODAL_TITLE = "Report Details";
const REPORT_ID_LABEL = "Report ID:";
const CLOSE_BUTTON_TEXT = "✕ Close";
const REPORTING_USER_TITLE = " Reporting User";
const REPORTED_USER_TITLE = " Reported User";
const SESSION_DETAILS_TITLE = " Session Details";
const REPORT_REASON_TITLE = " Report Reason";
const DESCRIPTION_TITLE = " Detailed Description";
const EVIDENCE_FILES_TITLE = " Evidence Files";
const NO_EMAIL_FALLBACK = "No email";
const SESSION_ID_LABEL = "Session ID:";
const SERVICE_1_LABEL = "Service 1:";
const SERVICE_2_LABEL = "Service 2:";
const SESSION_ID_FALLBACK = "N/A";
const EVIDENCE_FILE_PREFIX = "Evidence File ";
const WARN_REPORTED_BUTTON = "Warn Reported";
const WARN_REPORTER_BUTTON = "Warn Reporter";
const DISMISS_BUTTON = "Dismiss";
const RESOLVE_BUTTON = "Resolve";
const SUBMITTED_PREFIX = "Submitted ";
const EMAIL_ICON = "📧 ";

interface ReportDetailsModalProps {
  report: AdminReport;
  onClose: () => void;
  onResolve: (
    id: string,
    resolution: "dismiss" | "warn_reported" | "warn_reporter"
  ) => void;
  onMarkResolved: (id: string) => void;
  openWarningEmail: (r: AdminReport, flow: EmailFlow) => void;
  downloadEvidence: (url: string, id: string) => Promise<void>;
  downloading: Record<string, boolean>;
  formatName: (first?: string, last?: string) => string;
  formatDate: (s: string) => string;
  formatReason: (r: string) => string;
  getSessionTitle: (s: AdminReport["sessionId"]) => string;
  getStatusColor: (status: AdminReport["status"]) => string;
}

export function ReportDetailsModal({
  report,
  onClose,
  onResolve,
  onMarkResolved,
  openWarningEmail,
  downloadEvidence,
  downloading,
  formatName,
  formatDate,
  formatReason,
  getSessionTitle,
  getStatusColor,
}: ReportDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
        
        {/* HEADER - Modal title and close button */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-900">{MODAL_TITLE}</h2>
            <p className="text-sm text-gray-500 mt-1 text-gray-900 dark:text-gray-900">
              {REPORT_ID_LABEL} <code className="font-mono">{report._id}</code>
            </p>
          </div>
          <Button onClick={onClose} variant="outline" size="sm">
            {CLOSE_BUTTON_TEXT}
          </Button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* USERS SECTION - Information about reporting and reported users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reporting User */}
            <section className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-900">{REPORTING_USER_TITLE}</h4>
              <p className="font-medium">
                {formatName(
                  report.reportedBy?.firstName,
                  report.reportedBy?.lastName
                )}
              </p>
              <p className="text-sm text-gray-600">
                {EMAIL_ICON}{report.reportedBy?.email || NO_EMAIL_FALLBACK}
              </p>
            </section>
            
            {/* Reported User */}
            <section className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold mb-2">{REPORTED_USER_TITLE}</h4>
              <p className="font-medium">
                {formatName(
                  report.reportedUser?.firstName,
                  report.reportedUser?.lastName
                )}
              </p>
              <p className="text-sm text-gray-600">
                {EMAIL_ICON}{report.reportedUser?.email || NO_EMAIL_FALLBACK}
              </p>
            </section>
          </div>

          {/* SESSION DETAILS - Information about the session where the report occurred */}
          <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-2">{SESSION_DETAILS_TITLE}</h4>
            <p className="font-medium">{getSessionTitle(report.sessionId)}</p>
            <div className="text-sm text-gray-600">
              <p>
                <strong>{SESSION_ID_LABEL}</strong> {report.sessionId?._id || SESSION_ID_FALLBACK}
              </p>
              {report.sessionId?.descriptionOfService1 && (
                <p>
                  <strong>{SERVICE_1_LABEL}</strong>{" "}
                  {report.sessionId.descriptionOfService1}
                </p>
              )}
              {report.sessionId?.descriptionOfService2 && (
                <p>
                  <strong>{SERVICE_2_LABEL}</strong>{" "}
                  {report.sessionId.descriptionOfService2}
                </p>
              )}
            </div>
          </section>

          {/* REPORT CONTENT - Reason, description, and evidence files */}
          <section className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold mb-2">{REPORT_REASON_TITLE}</h4>
            <p className="font-medium">{formatReason(report.reason)}</p>
          </section>
          
          <section className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">{DESCRIPTION_TITLE}</h4>
            <div className="whitespace-pre-wrap">{report.description}</div>
          </section>
          
          {report.evidenceFiles.length > 0 && (
            <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2">{EVIDENCE_FILES_TITLE}</h4>
              <ul className="space-y-2">
                {report.evidenceFiles.map((url, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center bg-white p-3 rounded border"
                  >
                    <div>
                      <p className="font-medium">{EVIDENCE_FILE_PREFIX}{i + 1}</p>
                      <p className="text-xs text-gray-500">
                        {url.split("/").pop()}
                      </p>
                    </div>
                    <Button
                      onClick={() => downloadEvidence(url, report._id)}
                      disabled={downloading[`${url}-${report._id}`]}
                      size="sm"
                      variant="outline"
                    >
                      {downloading[`${url}-${report._id}`] ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* FOOTER - Status badge and action buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Badge className={getStatusColor(report.status)}>
              {report.status.replace(/_/g, " ")}
            </Badge>
            {report.status === "under_review" ? (
              <div className="space-x-2">
                <Button
                  onClick={() => openWarningEmail(report, "warn-reported")}
                  size="sm"
                  variant="outline"
                >
                  <AlertOctagon /> {WARN_REPORTED_BUTTON}
                </Button>
                <Button
                  onClick={() => openWarningEmail(report, "warn-reporter")}
                  size="sm"
                  variant="outline"
                >
                  <ShieldX /> {WARN_REPORTER_BUTTON}
                </Button>
                <Button
                  onClick={() => onResolve(report._id, "dismiss")}
                  size="sm"
                  variant="outline"
                >
                  <X /> {DISMISS_BUTTON}
                </Button>
                <Button
                  onClick={() => onMarkResolved(report._id)}
                  size="sm"
                  variant="outline"
                >
                  <CheckCircle /> {RESOLVE_BUTTON}
                </Button>
              </div>
            ) : (
              <span className="text-gray-500">
                {SUBMITTED_PREFIX}{formatDate(report.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}