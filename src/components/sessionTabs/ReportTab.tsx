import { Flag } from 'lucide-react';

interface ReportTabProps {
  session: any;
  existingReports: any[];
  loadingReports: boolean;
  showReportForm: boolean;
  setShowReportForm: (show: boolean) => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  reportDescription: string;
  setReportDescription: (description: string) => void;
  reportFiles: File[];
  setReportFiles: (files: File[]) => void;
  submittingReport: boolean;
  handleReportSubmit: (e: React.FormEvent) => void;
  handleReportFileAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleReportFileRemove: (index: number) => void;
  fetchReports: () => void;
  formatDate: (dateString: string) => string;
  showAlert: (type: string, message: string) => void;
}

export default function ReportTab({
  session,
  existingReports,
  loadingReports,
  showReportForm,
  setShowReportForm,
  reportReason,
  setReportReason,
  reportDescription,
  setReportDescription,
  reportFiles,
  setReportFiles,
  submittingReport,
  handleReportSubmit,
  handleReportFileAdd,
  handleReportFileRemove,
  fetchReports,
  formatDate,
  showAlert,
}: ReportTabProps) {
  return (
    <div className="space-y-6">
      {/* Existing Reports Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {(session?.status === 'completed' || session?.status === 'canceled') ? 'Session Reports' : 'Previous Reports'}
          </h2>
          <button
            onClick={fetchReports}
            disabled={loadingReports}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
          >
            {loadingReports ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loadingReports ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : existingReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Flag className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No reports submitted for this session yet.</p>
            {session?.status === 'active' && (
              <p className="text-xs mt-1">You can report issues during active sessions.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {existingReports.map((report) => (
              <div key={report._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    report.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(report.createdAt)}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {report.reason}
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  {report.description}
                </p>
                {report.evidenceFiles && report.evidenceFiles.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {report.evidenceFiles.length} evidence file(s) attached
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit New Report Section */}
      {(session?.status === 'completed' || session?.status === 'canceled') ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Session {session?.status === 'completed' ? 'Completed' : 'Cancelled'}
            </h3>
            <p className="text-gray-600 mb-4">
              This session has been {session?.status === 'completed' ? 'completed' : 'cancelled'}. You can no longer submit new reports.
            </p>
            <p className="text-sm text-gray-500">
              If you have concerns about {session?.status === 'completed' ? 'completed' : 'cancelled'} sessions, please contact support directly.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Collapsible Report Header */}
          <div className="mb-6">
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="flex items-center justify-between w-full p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Flag className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">Report an Issue</span>
              </div>
              <span className="text-red-600">
                {showReportForm ? '−' : '+'}
              </span>
            </button>
          </div>

          {/* Collapsible Report Form */}
          {showReportForm && (
            <div className="border-t border-gray-200 pt-6">
              <form onSubmit={handleReportSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Type *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select an issue type...</option>
                    <option value="Inappropriate Behavior">Inappropriate Behavior</option>
                    <option value="Not Following Agreed Terms">Not Following Agreed Terms</option>
                    <option value="Communication Issues">Communication Issues</option>
                    <option value="Quality of Work">Quality of Work</option>
                    <option value="No Show/Cancellation">No Show/Cancellation</option>
                    <option value="Safety Concerns">Safety Concerns</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Please provide details about the issue..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Files (Optional - Max 5 files)
                  </label>
                  <input
                    type="file"
                    onChange={handleReportFileAdd}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                    multiple
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Screenshots, documents, or other evidence (PDF, DOC, DOCX, TXT, JPG, PNG, ZIP)
                  </p>
                  
                  {reportFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {reportFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleReportFileRemove(index)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportForm(false);
                      setReportReason('');
                      setReportDescription('');
                      setReportFiles([]);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
