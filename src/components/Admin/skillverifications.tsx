'use client';
import { useEffect, useState } from 'react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface VerificationRequest {
    id: string;
    userId: string;
    skillName: string;
    skillId: string;
    status: 'pending' | 'approved' | 'rejected';
    documents: string[];
    description: string;
    feedback?: string; // Added feedback field
    createdAt: Date;
    updatedAt: Date;
    user?: User;
}

export default function VerificationRequests() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [feedback, setFeedback] = useState<string>(''); // Added feedback state
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // Added alert message state
  const [alertType, setAlertType] = useState<'success' | 'error'>('success'); // Added alert type

  useEffect(() => {
    fetchRequests();
  }, []);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Remove userId parameter to fetch all verification requests
      const response = await fetch('/api/admin/skill-verification-requests');
      
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
      
      // For each request, fetch the user details
      const requestsWithUserDetails = await Promise.all(
        normalizedRequests.map(async (request: VerificationRequest) => {
          try {
            const userResponse = await fetch(`/api/users/profile?id=${request.userId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success && userData.user) {
                return {
                  ...request,
                  user: userData.user
                };
              }
            }
            return request;
          } catch (error) {
            console.error(`Error fetching user for request ${request.id}:`, error);
            return request;
          }
        })
      );

      setRequests(requestsWithUserDetails);
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
      console.log('Updating status:', { 
        requestId, 
        newStatus, 
        skillId: selectedRequest?.skillId,
        currentStatus: selectedRequest?.status,
        feedback: newStatus === 'rejected' ? feedback : undefined
      }); 
      
      if (!selectedRequest) {
        throw new Error('No request selected');
      }
      
      // Validate feedback for rejection
      if (newStatus === 'rejected' && !feedback.trim()) {
        setError('Please provide feedback for rejection');
        return;
      }
      
      setError(null);
      
      const response = await fetch(`/api/admin/skill-verification-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          skillId: selectedRequest.skillId,
          feedback: newStatus === 'rejected' ? feedback : undefined
        }),
      });
  
      // Log the raw response for debugging
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      const updatedData = await response.json();
      console.log('Update response:', updatedData); 
  
      if (!updatedData.success) {
        throw new Error(updatedData.message || 'Failed to update status');
      }
  
      // Update the local state immediately - deep copy for safety
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { 
            ...req, 
            status: newStatus,
            feedback: newStatus === 'rejected' ? feedback : req.feedback
          } : req
        )
      );
  
      // Update selected request if it's the one being modified
      setSelectedRequest(prev =>
        prev?.id === requestId ? { 
          ...prev, 
          status: newStatus,
          feedback: newStatus === 'rejected' ? feedback : prev.feedback 
        } : prev
      );
      
      // Show success alert
      setAlertType('success');
      setAlertMessage(`Skill verification request has been ${newStatus} successfully`);
      
      // Clear feedback field after successful rejection
      if (newStatus === 'rejected') {
        setFeedback('');
      }
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while updating the status');
      
      // Show error alert
      setAlertType('error');
      setAlertMessage(`Failed to ${newStatus} the skill verification request`);
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

  // Filter requests based on status and search term
  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const userName = `${request.user?.firstName || ''} ${request.user?.lastName || ''}`.trim().toLowerCase();
    const userEmail = (request.user?.email || '').toLowerCase();
    
    const matchesSearch = searchTerm === '' || 
      request.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.includes(searchTerm.toLowerCase()) ||
      userEmail.includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Helper function to get user display name
  const getUserDisplayName = (request: VerificationRequest) => {
    if (request.user?.firstName || request.user?.lastName) {
      return `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim();
    }
    return 'Unknown User';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Alert Messages */}
      {alertMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          alertType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`mr-3 flex-shrink-0 ${
              alertType === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {alertType === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>{alertMessage}</div>
            <button 
              onClick={() => setAlertMessage(null)}
              className="ml-auto text-gray-600 hover:text-gray-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Left side - Requests List */}
      <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
        <h1 className="text-2xl font-bold mb-6">Skill Verification Requests</h1>
        
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search by name, email, skill name..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setStatusFilter('all')} 
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('pending')} 
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button 
              onClick={() => setStatusFilter('approved')} 
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === 'approved' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Approved
            </button>
            <button 
              onClick={() => setStatusFilter('rejected')} 
              className={`px-3 py-1 rounded-lg text-sm ${
                statusFilter === 'rejected' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-600">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} found
          </span>
          <button 
            onClick={fetchRequests}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
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
        ) : filteredRequests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {error ? 'Unable to load requests' : 'No requests found'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => {
                  setSelectedRequest(request);
                  setFeedback(request.feedback || ''); // Load feedback if exists
                }}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedRequest?.id === request.id
                    ? 'bg-blue-100'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                      {request.user?.avatar ? (
                        <img
                          src={request.user.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold text-lg">
                          {getUserDisplayName(request).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{request.skillName}</h3>
                      <p className="text-sm font-medium">
                        {getUserDisplayName(request)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
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
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden mr-4">
                  {selectedRequest.user?.avatar ? (
                    <img
                      src={selectedRequest.user.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold text-xl">
                      {getUserDisplayName(selectedRequest).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{getUserDisplayName(selectedRequest)}</h3>
                  {selectedRequest.user?.email && (
                    <p className="text-sm text-gray-600">{selectedRequest.user.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">User ID</label>
                  <p className="mt-1 text-sm text-gray-500">{selectedRequest.userId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Skill Name</label>
                  <p className="mt-1 font-medium">{selectedRequest.skillName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Skill ID</label>
                  <p className="mt-1 text-sm text-gray-500">{selectedRequest.skillId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <p className={`mt-1 font-medium ${
                    selectedRequest.status === 'pending'
                      ? 'text-yellow-600'
                      : selectedRequest.status === 'approved'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Submission Date</label>
                  <p className="mt-1">{new Date(selectedRequest.createdAt).toLocaleDateString()} {new Date(selectedRequest.createdAt).toLocaleTimeString()}</p>
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
                  <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-lg border">{selectedRequest.description}</p>
                </div>
              )}

              {/* Show feedback if status is rejected */}
              {selectedRequest.status === 'rejected' && selectedRequest.feedback && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Admin Feedback</label>
                  <p className="mt-1 text-gray-600 bg-red-50 p-3 rounded-lg border border-red-100">{selectedRequest.feedback}</p>
                </div>
              )}

              {/* Admin Feedback field for pending requests */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Admin Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Required for rejection. Provide feedback to explain why the skill verification is being rejected."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-24"
                  />
                </div>
              )}

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                  disabled={selectedRequest.status !== 'pending'}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    selectedRequest.status === 'pending'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                  disabled={selectedRequest.status !== 'pending'}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    selectedRequest.status === 'pending'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Select a request to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}