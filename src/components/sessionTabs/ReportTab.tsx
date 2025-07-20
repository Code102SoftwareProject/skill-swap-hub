import { Flag, Upload, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useReport } from '@/hooks/useReport';
import { reportService } from '@/services/reportService';
import type { Session } from '@/types';

interface ReportTabProps {
  session: Session | null;
  currentUserId: string | undefined;
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  formatDate: (dateString: string) => string;
  user?: any;
  token: string; // JWT token for API authentication
}

export default function ReportTab({
  session,
  currentUserId,
  showAlert,
  formatDate,
  user,
  token,
}: ReportTabProps) {
  const {
    // Form state
    showReportForm,
    setShowReportForm,
    reportReason,
    setReportReason,
    reportDescription,
    setReportDescription,
    reportFiles,
    submittingReport,
    
    // Data state
    existingReports,
    loadingReports,
    
    // Validation
    formErrors,
    
    // Actions
    handleFileAdd,
    handleFileRemove,
    handleSubmit,
    resetForm,
    fetchReports,
    
    // Utilities
    getReportStats,
    formatFileSize,
  } = useReport({ session, currentUserId, showAlert, user, token });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };
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
            {existingReports.map((report) => {
              // Handle both populated objects and string IDs
              const reportedById = typeof report.reportedBy === 'object' ? report.reportedBy._id : report.reportedBy;
              const reportedUserId = typeof report.reportedUser === 'object' ? report.reportedUser._id : report.reportedUser;
              
              const isReportedUser = reportedUserId === currentUserId;
              const isReporter = reportedById === currentUserId;
              
              // Get reporter name for display
              const getReporterName = () => {
                if (typeof report.reportedBy === 'object' && report.reportedBy.firstName) {
                  return `${report.reportedBy.firstName} ${report.reportedBy.lastName || ''}`.trim();
                }
                return 'Another user';
              };
              
              return (
                <div key={report._id} className={`border rounded-lg p-4 ${
                  isReportedUser ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status === 'resolved' ? 'Resolved' :
                       report.status === 'reviewed' ? 'Under Review' : 'Pending'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>
                  
                  {isReportedUser ? (
                    // Show when current user is being reported
                    <div className="mb-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <h4 className="font-medium text-red-900">
                          You were reported by {getReporterName()}
                        </h4>
                      </div>
                      <p className="text-sm text-red-700 mb-1">
                        <strong>Reason:</strong> {reportService.getReasonDisplayText(report.reason)}
                      </p>
                      <p className="text-sm text-red-700 mb-2">
                        <strong>Details:</strong> {report.description}
                      </p>
                      <div className="text-xs text-red-600 bg-red-100 p-2 rounded border border-red-200">
                        <p className="font-medium mb-1">Report Status: {report.status === 'pending' ? 'Under Review' : report.status}</p>
                        <p>
                          Our team will validate this report shortly. If you believe this report was made in error, 
                          please contact support with your session details.
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Show when current user made the report
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900 mb-1">
                        Your report: {reportService.getReasonDisplayText(report.reason)}
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">
                        {report.description}
                      </p>
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                        <p>
                          Report submitted against the other user in this session. 
                          Status: <span className="font-medium">{report.status === 'pending' ? 'Under Review' : report.status}</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {report.evidenceFiles && report.evidenceFiles.length > 0 && (
                    <div className="text-xs text-gray-500 mt-2">
                      📎 {report.evidenceFiles.length} evidence file(s) attached
                    </div>
                  )}
                </div>
              );
            })}
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
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Type *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      formErrors.reason ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select an issue type...</option>
                    <option value="inappropriate_behavior">Inappropriate Behavior</option>
                    <option value="not_following_session_terms">Not Following Agreed Terms</option>
                    <option value="not_responsive">Communication Issues</option>
                    <option value="poor_quality_work">Quality of Work</option>
                    <option value="not_submitting_work">No Show/Not Submitting Work</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.reason && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.reason}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Please provide details about the issue..."
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      formErrors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    rows={4}
                    required
                  />
                  {formErrors.description && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Files (Optional - Max 5 files)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> evidence files
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC (MAX. 10MB each)</p>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileAdd}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                        multiple
                        disabled={reportFiles.length >= 5}
                      />
                    </label>
                  </div>
                  {formErrors.files && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.files}</p>
                  )}
                  
                  {reportFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Attached Files ({reportFiles.length}/5)
                      </p>
                      {reportFiles.map((reportFile, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                          reportFile.error ? 'bg-red-50 border-red-200' :
                          reportFile.uploaded ? 'bg-green-50 border-green-200' :
                          reportFile.uploading ? 'bg-blue-50 border-blue-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-3">
                            {reportFile.uploading ? (
                              <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                            ) : reportFile.uploaded ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : reportFile.error ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Upload className="h-4 w-4 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {reportFile.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(reportFile.file.size)}
                                {reportFile.uploading && ' - Uploading...'}
                                {reportFile.uploaded && ' - Uploaded successfully'}
                                {reportFile.error && ` - ${reportFile.error}`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileRemove(index)}
                            disabled={reportFile.uploading}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      {/* Upload Progress Summary */}
                      {(() => {
                        const stats = getReportStats();
                        if (stats.totalFiles > 0) {
                          return (
                            <div className="text-xs text-gray-500 pt-2">
                              Upload Status: {stats.uploadedFiles} uploaded, {stats.uploadingFiles} uploading
                              {stats.failedFiles > 0 && `, ${stats.failedFiles} failed`}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport || !getReportStats().canSubmit}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {submittingReport && <Clock className="h-4 w-4 animate-spin" />}
                    <span>{submittingReport ? 'Submitting...' : 'Submit Report'}</span>
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
