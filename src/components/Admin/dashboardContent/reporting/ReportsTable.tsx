// src/components/Admin/dashboardContent/reporting/ReportsTable.tsx

import React from "react";
import {
  Mail,
  MailCheck,
  Loader2,
  AlertOctagon,
  ShieldX,
  X,
  CheckCircle,
  Download,
  Eye,
  SortAsc,
  SortDesc,
} from "lucide-react";
import type { ReportsTableProps } from "./types";

export function ReportsTable({
  reports,
  sortDirection,
  onToggleSort,
  downloading,
  onDownloadEvidence,
  sendingEmails,
  onSendNotification,
  onSendNotificationToReporter,
  onSendNotificationToReported,
  onOpenWarningEmail,
  resolvingReport,
  onResolve,
  onMarkResolved,
  onViewDetails,
  formatName,
  formatReason,
  formatDate,
  getStatusColor,
}: ReportsTableProps) {
  return (
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
                  onClick={onToggleSort}
                  className="ml-2 p-1 rounded hover:bg-gray-200"
                  title={`Sort by date ${
                    sortDirection === "asc" ? "descending" : "ascending"
                  }`}
                >
                  {sortDirection === "asc" ? (
                    <SortDesc className="w-4 h-4 text-gray-500" />
                  ) : (
                    <SortAsc className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report._id} className="bg-white hover:bg-gray-50">
              {/* Reporting User */}
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
                      {report.reportedBy?.email ?? "No email"}
                    </div>
                  </div>
                  {/* ask the reporter for more info */}
                  <button
                    onClick={() =>
                      onOpenWarningEmail(report, "initial-reporter")
                    }
                    disabled={!report.reportedBy?.email}
                    title="Please provide any additional details"
                    className="p-2 ml-2 text-gray-600 hover:text-gray-800"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </td>

              {/* Reported User */}
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
                      {report.reportedUser?.email ?? "No email"}
                    </div>
                  </div>
                  {/* ask the reported user for their side */}
                  <button
                    onClick={() =>
                      onOpenWarningEmail(report, "initial-reported")
                    }
                    disabled={!report.reportedUser?.email}
                    title="Please share your side of the story"
                    className="p-2 ml-2 text-gray-600 hover:text-gray-800"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </td>

              {/* Reason */}
              <td className="px-4 py-3 border-b">
                <div className="text-sm font-medium text-gray-900">
                  {formatReason(report.reason)}
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3 border-b">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    report.status
                  )}`}
                >
                  {report.status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </td>

              {/* Created At */}
              <td className="px-4 py-3 border-b">
                <div className="text-sm text-gray-900">
                  {formatDate(report.createdAt)}
                </div>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 border-b">
                <div className="flex items-center justify-center space-x-1">
                  {/* view details */}
                  <button
                    onClick={() => onViewDetails(report)}
                    className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                    title="View details"
                  >
                    <Eye className="h-3 w-3" />
                  </button>

                  {report.status === "pending" && (
                    <button
                      onClick={() => onSendNotification(report._id)}
                      disabled={sendingEmails === report._id}
                      className={`p-2 rounded ${
                        sendingEmails === report._id
                          ? "bg-blue-200 text-blue-700 cursor-not-allowed"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                      title="Mark as Under Review"
                    >
                      {sendingEmails === report._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <MailCheck className="h-3 w-3" />
                      )}
                    </button>
                  )}

                  {report.status === "under_review" && (
                    <>
                      {/* warn reported user */}
                      <button
                        onClick={() =>
                          onOpenWarningEmail(report, "warn-reported")
                        }
                        disabled={!report.reportedUser?.email}
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded"
                        title="Warn reported user"
                      >
                        <AlertOctagon className="h-3 w-3" />
                      </button>
                      {/* warn reporting user */}
                      <button
                        onClick={() =>
                          onOpenWarningEmail(report, "warn-reporter")
                        }
                        disabled={!report.reportedBy?.email}
                        className="p-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded"
                        title="Warn reporting user"
                      >
                        <ShieldX className="h-3 w-3" />
                      </button>
                      {/* dismiss */}
                      <button
                        onClick={() => onResolve(report._id, "dismiss")}
                        disabled={resolvingReport === report._id}
                        className={`p-2 rounded ${
                          resolvingReport === report._id
                            ? "bg-gray-200 text-gray-700 cursor-not-allowed"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        title="Dismiss report"
                      >
                        {resolvingReport === report._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                      {/* mark solved */}
                      <button
                        onClick={() => onMarkResolved(report._id)}
                        disabled={resolvingReport === report._id}
                        className={`p-2 rounded flex items-center gap-1 ${
                          resolvingReport === report._id
                            ? "bg-green-200 text-green-700 cursor-not-allowed"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                        title="Mark resolved"
                      >
                        {resolvingReport === report._id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </button>
                    </>
                  )}

                  {report.status === "resolved" && (
                    <button
                      className="p-2 bg-green-100 text-green-700 rounded opacity-70"
                      disabled
                    >
                      <CheckCircle className="h-3 w-3" />
                    </button>
                  )}

                  {/* download evidence */}
                  {report.evidenceFiles.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          onDownloadEvidence(
                            report.evidenceFiles[0],
                            report._id
                          )
                        }
                        disabled={
                          downloading[
                            `${report.evidenceFiles[0]}-${report._id}`
                          ]
                        }
                        className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
                        title={`Download evidence (${report.evidenceFiles.length})`}
                      >
                        {downloading[
                          `${report.evidenceFiles[0]}-${report._id}`
                        ] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
                      {report.evidenceFiles.length > 1 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {report.evidenceFiles.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
