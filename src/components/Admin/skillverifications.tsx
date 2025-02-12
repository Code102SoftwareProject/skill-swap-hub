'use client';
import { useEffect, useState } from 'react';

interface VerificationRequest extends Document {
    _id: string;
    userId: string;
    skillName: string;
    status: 'pending' | 'approved' | 'rejected';
    documents: string[];
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

export default function VerificationRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/verification-request?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error('Invalid data format received from server');
      }

      // Normalize the status values
      const normalizedRequests = data.data.map((request: VerificationRequest) => ({
        ...request,
        status: request.status.toLowerCase()
      }));

      console.log('Normalized requests:', normalizedRequests); 
      setRequests(normalizedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      console.log('Updating status:', { requestId, newStatus, 
        currentStatus: selectedRequest?.status }); // Debug log
      
      setError(null);
      const response = await fetch(`/api/users/verification-request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedData = await response.json();
      console.log('Update response:', updatedData); 

      // Update the local state immediately
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req._id === requestId ? { ...req, status: newStatus } : req
        )
      );

      // Update selected request if it's the one being modified
      setSelectedRequest(prev =>
        prev?._id === requestId ? { ...prev, status: newStatus } : prev
      );
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while updating the status');
    }
  };

  const handleViewDocument = async (documentUrl: string) => {
    try {
      setDocumentLoading(true);
      setError(null);

      const response = await fetch('/api/documents/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: documentUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create a blob URL for viewing the document
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setViewingDocument(url);

      // Open document in new window/tab
      window.open(url, '_blank');

      // Clean up the blob URL after opening
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error viewing document:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while viewing the document');
    } finally {
      setDocumentLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Requests List */}
      <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
        <div className="mb-6">
          <div className="relative">
            <input
              type="search"
              placeholder="Search Requests..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {error ? 'Unable to load requests' : 'No requests found'}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                onClick={() => setSelectedRequest(request)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedRequest?._id === request._id
                    ? 'bg-blue-100'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                      <img
                        src="/api/placeholder/40/40"
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">User ID: {request.userId}</h3>
                      <p className="text-sm text-gray-600">{request.skillName}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-sm rounded-full ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side - Request Details */}
      <div className="w-1/2 p-6">
        {selectedRequest ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Verification Request Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">User ID</label>
                  <p className="mt-1">{selectedRequest.userId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Skill Name</label>
                  <p className="mt-1">{selectedRequest.skillName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">{selectedRequest.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Submission Date</label>
                  <p className="mt-1">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Uploaded Documents</label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {selectedRequest.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">Document {index + 1}</span>
                      </div>
                      <button
                        onClick={() => handleViewDocument(doc)}
                        disabled={documentLoading}
                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        {documentLoading ? 'Loading...' : 'View'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Description</label>
                  <p className="mt-1 text-gray-600">{selectedRequest.description}</p>
                </div>
              )}

       <div className="flex space-x-4 mt-6">
        <button
          onClick={() => handleUpdateStatus(selectedRequest._id, 'approved')}
          disabled={selectedRequest.status !== 'pending'}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            selectedRequest.status === 'pending'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Approve (Status: {selectedRequest.status})
        </button>
        <button
          onClick={() => handleUpdateStatus(selectedRequest._id, 'rejected')}
          disabled={selectedRequest.status !== 'pending'}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            selectedRequest.status === 'pending'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Reject (Status: {selectedRequest.status})
        </button>
      </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a request to view details
          </div>
        )}
      </div>
    </div>
  );
}