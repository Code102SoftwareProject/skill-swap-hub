"use client"

import React from 'react';
import { X, Download, Eye, AlertCircle } from 'lucide-react';

interface SkillDetailsModalProps {
  request: {
    id: string;
    skillName: string;
    status: 'pending' | 'approved' | 'rejected';
    documents: string[];
    description: string;
    feedback?: string;
    createdAt: Date;
  };
  isOpen: boolean;
  onClose: () => void;
}

const SkillDetailsModal: React.FC<SkillDetailsModalProps> = ({
  request,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  // Helper function to get status color class
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-orange-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Helper function to get status text
  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Function to handle document viewing/downloading
  const handleDocumentAction = async (documentUrl: string) => {
    try {
      const fileExtension = documentUrl.split('.').pop()?.toLowerCase();
      
      // Use our API as a proxy to fetch the document
      const response = await fetch('/api/documents/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: documentUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const blob = await response.blob();
      
      // If it's an image or PDF, open in new tab
      if (fileExtension === 'pdf' || fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
      } else {
        // For other file types, trigger download
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `document.${fileExtension}`; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Error handling document:', error);
      alert('Error accessing document. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Skill Verification Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Skill Name</h3>
            <p className="text-gray-600">{request.skillName}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Status</h3>
            <span
              className={`px-3 py-1 rounded-full text-white text-sm inline-block
                ${getStatusColor(request.status)}`}
            >
              {getStatusText(request.status)}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Submission Date</h3>
            <p className="text-gray-600">
              {new Date(request.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">
              {request.description || 'No description provided'}
            </p>
          </div>

          {/* Admin Feedback Section */}
          {(request.status === 'approved' || request.status === 'rejected') && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
                Admin Feedback
              </h3>
              <div className={`p-4 rounded-lg ${
                request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`${
                  request.status === 'approved' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {request.feedback || 'No feedback provided'}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Uploaded Documents</h3>
            <div className="space-y-2">
              {request.documents.length > 0 ? (
                request.documents.map((doc, index) => {
                  const fileExtension = doc.split('.').pop()?.toLowerCase();
                  const isViewable = ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension || '');
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <span className="text-gray-600">Document {index + 1}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDocumentAction(doc)}
                          className="flex items-center gap-2  bg-slate-700 px-4 py-2 text-sm rounded-md transition-colors hover:bg-blue-800"
                        >
                          {isViewable ? (
                            <>
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No documents uploaded</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillDetailsModal;