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
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">Report Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              Report ID: <code className="font-mono">{report._id}</code>
            </p>
          </div>
          <Button onClick={onClose} variant="outline" size="sm">
            ✕ Close
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Reporting & Reported users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reporting User */}
            <section className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">👤 Reporting User</h4>
              <p className="font-medium">
                {formatName(
                  report.reportedBy?.firstName,
                  report.reportedBy?.lastName
                )}
              </p>
              <p className="text-sm text-gray-600">
                📧 {report.reportedBy?.email || "No email"}
              </p>
            </section>
            {/* Reported User */}
            <section className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold mb-2">🚨 Reported User</h4>
              <p className="font-medium">
                {formatName(
                  report.reportedUser?.firstName,
                  report.reportedUser?.lastName
                )}
              </p>
              <p className="text-sm text-gray-600">
                📧 {report.reportedUser?.email || "No email"}
              </p>
            </section>
          </div>

          {/* Session Details */}
          <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-2">🔄 Session Details</h4>
            <p className="font-medium">{getSessionTitle(report.sessionId)}</p>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Session ID:</strong> {report.sessionId?._id || "N/A"}
              </p>
              {report.sessionId?.descriptionOfService1 && (
                <p>
                  <strong>Service 1:</strong>{" "}
                  {report.sessionId.descriptionOfService1}
                </p>
              )}
              {report.sessionId?.descriptionOfService2 && (
                <p>
                  <strong>Service 2:</strong>{" "}
                  {report.sessionId.descriptionOfService2}
                </p>
              )}
            </div>
          </section>

          {/* Reason, Description, Evidence */}
          <section className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold mb-2">⚠️ Report Reason</h4>
            <p className="font-medium">{formatReason(report.reason)}</p>
          </section>
          <section className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">📝 Detailed Description</h4>
            <div className="whitespace-pre-wrap">{report.description}</div>
          </section>
          {report.evidenceFiles.length > 0 && (
            <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2">📎 Evidence Files</h4>
              <ul className="space-y-2">
                {report.evidenceFiles.map((url, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center bg-white p-3 rounded border"
                  >
                    <div>
                      <p className="font-medium">Evidence File {i + 1}</p>
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

          {/* Status + Resolve Actions */}
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
                  <AlertOctagon /> Warn Reported
                </Button>
                <Button
                  onClick={() => openWarningEmail(report, "warn-reporter")}
                  size="sm"
                  variant="outline"
                >
                  <ShieldX /> Warn Reporter
                </Button>
                <Button
                  onClick={() => onResolve(report._id, "dismiss")}
                  size="sm"
                  variant="outline"
                >
                  <X /> Dismiss
                </Button>
                <Button
                  onClick={() => onMarkResolved(report._id)}
                  size="sm"
                  variant="outline"
                >
                  <CheckCircle /> Resolve
                </Button>
              </div>
            ) : (
              <span className="text-gray-500">
                Submitted {formatDate(report.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
