import { CheckCircle, FileText, XCircle } from 'lucide-react';
import { useWorkSubmission } from '@/hooks/useWorkSubmission';

interface SubmitWorkTabProps {
  session: any;
  currentUserId: string;
  formatDate: (dateString: string) => string;
  showAlert: (type: string, message: string) => void;
}

export default function SubmitWorkTab({
  session,
  currentUserId,
  formatDate,
  showAlert,
}: SubmitWorkTabProps) {
  const {
    workDescription,
    setWorkDescription,
    workFiles,
    uploading,
    userWorks,
    handleSubmitWork,
    handleDownloadFile,
    clearForm,
    addFiles,
    removeFile,
    updateFileTitle,
  } = useWorkSubmission(
    session?._id,
    currentUserId,
    session, // Pass the session object
    (message) => showAlert('success', message),
    (message) => showAlert('error', message),
    (message) => showAlert('warning', message)
  );
  return (
    <div className="space-y-6">
      {/* Session Completed or Cancelled Message or Submit Form */}
      {(session?.status === 'completed' || session?.status === 'canceled') ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            {session?.status === 'completed' ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Completed</h2>
                <p className="text-gray-600 mb-4">
                  This session has been completed. You can no longer submit new work.
                </p>
                <p className="text-sm text-gray-500">
                  You can still view previously submitted work below.
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Cancelled</h2>
                <p className="text-gray-600 mb-4">
                  This session has been cancelled. You can no longer submit new work.
                </p>
                <p className="text-sm text-gray-500">
                  You can still view previously submitted work below.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Work</h2>
          
          <form onSubmit={handleSubmitWork} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Description *
              </label>
              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Describe the work you've completed, what you've learned, or what you've taught..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach Files (Optional - Max 5 files, 25MB each)
              </label>
              
              {/* File Upload Input */}
              <input
                type="file"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const maxSizeMB = 25;
                  const maxSizeBytes = maxSizeMB * 1024 * 1024; // 25MB in bytes
                  
                  // Filter out files that are too large
                  const validFiles = files.filter(file => {
                    if (file.size > maxSizeBytes) {
                      showAlert('error', `File "${file.name}" is too large. Maximum file size is ${maxSizeMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
                      return false;
                    }
                    return true;
                  });
                  
                  // Only add valid files
                  if (validFiles.length > 0) {
                    addFiles(validFiles);
                  }
                  
                  // Clear the input
                  e.target.value = '';
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.mp4,.mov,.avi,.mkv"
                multiple
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP, MP4, MOV, AVI, MKV
              </p>
              
              {/* Selected Files List */}
              {workFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Selected Files ({workFiles.length}/5):</p>
                  {workFiles.map((workFileItem, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{workFileItem.file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(workFileItem.file.size / (1024 * 1024)).toFixed(1)} MB)
                            </span>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Title for this file:
                            </label>
                            <input
                              type="text"
                              value={workFileItem.title}
                              onChange={(e) => {
                                updateFileTitle(index, e.target.value);
                              }}
                              placeholder="Enter a descriptive title..."
                              className="w-full text-sm p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            removeFile(index);
                          }}
                          className="ml-3 text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Previously Submitted Works */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {(session?.status === 'completed' || session?.status === 'canceled') ? 'Previously Submitted Works' : 'Your Submitted Works'} ({userWorks.length})
        </h2>
        
        {userWorks.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Submitted</h3>
            <p className="text-gray-600">
              {(session?.status === 'completed' || session?.status === 'canceled')
                ? 'You did not submit any work during this session.' 
                : 'You haven\'t submitted any work yet.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userWorks.map((work) => (
              <div key={work._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="font-medium text-gray-900">Your Work</div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      work.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                      work.acceptanceStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {work.acceptanceStatus}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(work.provideDate)}
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
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {file.fileTitle}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {file.fileName}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(file.fileURL, file.fileName)}
                            className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : work.workURL && work.workURL !== 'text-only' ? (
                  <div className="mb-3">
                    <button
                      onClick={() => handleDownloadFile(work.workURL)}
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Download Attachment</span>
                    </button>
                  </div>
                ) : null}
                
                {work.remark && work.acceptanceStatus === 'accepted' && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                    <div className="text-sm font-medium text-green-800 mb-1">Acceptance Message:</div>
                    <div className="text-sm text-green-700">{work.remark}</div>
                  </div>
                )}
                
                {work.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</div>
                    <div className="text-sm text-red-700">{work.rejectionReason}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
