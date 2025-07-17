import { FileText, Download, CheckCircle, XCircle } from 'lucide-react';
import { useViewWorks } from '../../hooks/useViewWorks';

interface ViewWorksTabProps {
  session: any;
  currentUserId: string;
  sessionId: string;
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
  onWorkUpdate?: () => void;
  otherUserDetails?: any;
}

export default function ViewWorksTab({
  session,
  currentUserId,
  sessionId,
  showAlert,
  onWorkUpdate,
  otherUserDetails,
}: ViewWorksTabProps) {
  const {
    works,
    loading,
    processingWorkId,
    submittingReview,
    reviewingWork,
    reviewAction,
    reviewMessage,
    setReviewMessage,
    formatDate,
    getUserName,
    handleDownloadFile,
    openReviewModal,
    closeReviewModal,
    submitReview,
  } = useViewWorks({
    session,
    currentUserId,
    sessionId,
    onAlert: showAlert,
    onWorksUpdate: onWorkUpdate,
    otherUserDetails,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading works...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Submitted Works ({works.length})
          </h2>
          
          {works.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Works Yet</h3>
              <p className="text-gray-600">No work has been submitted for this session yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {works.map((work: any) => (
                <div key={work._id} className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                  processingWorkId === work._id ? 'bg-blue-50 border-blue-200' : ''
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium text-gray-900">
                        {getUserName(work.provideUser)}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        work.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                        work.acceptanceStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {work.acceptanceStatus === 'accepted' ? 'Accepted' :
                         work.acceptanceStatus === 'rejected' ? 'Needs Improvement' :
                         'Pending Review'}
                      </span>
                      {processingWorkId === work._id && (
                        <span className="text-xs text-blue-600 flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                          <span>Processing...</span>
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(work.submissionDate)}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{work.workDescription}</p>
                  
                  {/* Display multiple files if available */}
                  {work.workFiles && work.workFiles.length > 0 ? (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Attachments ({work.workFiles.length}):
                      </div>
                      <div className="space-y-2">
                        {work.workFiles.map((file: any, index: number) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{file.fileName || `File ${index + 1}`}</span>
                            <button
                              onClick={() => handleDownloadFile(file.fileURL, file.fileName)}
                              className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : work.workURL && work.workURL !== 'text-only' ? (
                    <div className="mb-3">
                      <button
                        onClick={() => handleDownloadFile(work.workURL, 'work-file')}
                        className="text-blue-600 hover:text-blue-700 flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Attachment</span>
                      </button>
                    </div>
                  ) : null}
                  
                  {/* Action buttons for receiving user */}
                  {work.receiveUser._id === currentUserId && work.acceptanceStatus === 'pending' && (
                    <div className="mt-3 flex items-center space-x-2">
                      <button
                        onClick={() => openReviewModal(work._id, 'accept')}
                        disabled={processingWorkId === work._id}
                        className={`px-3 py-1 text-white text-sm rounded transition-colors flex items-center space-x-1 ${
                          processingWorkId === work._id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {processingWorkId === work._id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>Accept</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openReviewModal(work._id, 'reject')}
                        disabled={processingWorkId === work._id}
                        className={`px-3 py-1 text-white text-sm rounded transition-colors flex items-center space-x-1 ${
                          processingWorkId === work._id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {processingWorkId === work._id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Request Improvement</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {work.remark && work.acceptanceStatus === 'accepted' && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                      <div className="text-sm font-medium text-green-800">Acceptance Note:</div>
                      <div className="text-sm text-green-700">{work.remark}</div>
                    </div>
                  )}
                  
                  {work.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                      <div className="text-sm font-medium text-red-800">Improvement Request:</div>
                      <div className="text-sm text-red-700">{work.rejectionReason}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Work Review Modal */}
      {reviewingWork && reviewAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {reviewAction === 'accept' ? 'Accept Work' : 'Request Improvement'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reviewAction === 'accept' ? 'Acceptance Message (Optional)' : 'Improvement Request *'}
                </label>
                <textarea
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey && !submittingReview) {
                      e.preventDefault();
                      submitReview();
                    }
                    if (e.key === 'Escape' && !submittingReview) {
                      e.preventDefault();
                      closeReviewModal();
                    }
                  }}
                  placeholder={
                    reviewAction === 'accept' 
                      ? 'Add a message to thank or acknowledge the work...' 
                      : 'Please specify what improvements are needed...'
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required={reviewAction === 'reject'}
                  disabled={submittingReview}
                  autoFocus
                />
                <div className="text-xs text-gray-500 mt-1">
                  Press Ctrl+Enter to submit, Esc to cancel
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={closeReviewModal}
                  disabled={submittingReview}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={submittingReview}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                    reviewAction === 'accept' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submittingReview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{reviewAction === 'accept' ? 'Accept Work' : 'Send Improvement Request'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
