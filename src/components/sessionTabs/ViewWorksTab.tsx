import { FileText } from 'lucide-react';

interface ViewWorksTabProps {
  works: any[];
  currentUserId: string;
  formatDate: (dateString: string) => string;
  getUserName: (user: any) => string;
  handleDownloadFile: (fileURL: string, fileName?: string) => void;
  setReviewingWork: (workId: string | null) => void;
  setReviewAction: (action: 'accept' | 'reject' | null) => void;
  setReviewMessage: (message: string) => void;
}

export default function ViewWorksTab({
  works,
  currentUserId,
  formatDate,
  getUserName,
  handleDownloadFile,
  setReviewingWork,
  setReviewAction,
  setReviewMessage,
}: ViewWorksTabProps) {
  return (
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
            {works.map((work) => (
              <div key={work._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="font-medium text-gray-900">
                      {getUserName(work.provideUser)}
                    </div>
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
                
                {/* Action buttons for receiving user */}
                {work.receiveUser._id === currentUserId && work.acceptanceStatus === 'pending' && (
                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setReviewingWork(work._id);
                        setReviewAction('accept');
                        setReviewMessage('');
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        setReviewingWork(work._id);
                        setReviewAction('reject');
                        setReviewMessage('');
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Request Improvement
                    </button>
                  </div>
                )}
                
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
