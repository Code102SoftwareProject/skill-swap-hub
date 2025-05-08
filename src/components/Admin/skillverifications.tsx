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
    feedback?: string; 
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
  const [feedback, setFeedback] = useState<string>(''); 
  const [alertMessage, setAlertMessage] = useState<string | null>(null); 
  const [alertType, setAlertType] = useState<'success' | 'error'>('success'); 

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
    <div className="flex min-h-screen  bg-gray-50"> {/* Adjusted gradient */}
      {/* Alert Messages */}
      {alertMessage && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-lg shadow-xl border transition-all duration-300 ease-in-out transform translate-x-0 ${
          alertType === 'success' 
            ? 'bg-green-50 border-green-300 text-green-800' 
            : 'bg-red-50 border-red-300 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`mr-3 flex-shrink-0 ${
              alertType === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {alertType === 'success' ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="font-medium">{alertMessage}</div>
            <button 
              onClick={() => setAlertMessage(null)}
              className="ml-4 -mr-1 p-1 rounded-md text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Left side - Requests List */}
      <div className="w-1/2 p-8 overflow-y-auto border-r "> {/* Slightly transparent border */}
        <h1 className="text-3xl text-gray-900 font-bold mb-8 tracking-tight">Skill Verification Requests</h1> {/* Adjusted text color and tracking */}
        
        <div className="mb-8 space-y-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search by name, email, skill..."
              className="w-full pl-10 pr-4 py-2.5 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-shadow duration-150 focus:shadow-md" // Enhanced focus state
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          
          <div className="flex space-x-2">
            {[
              { label: 'All', value: 'all', color: 'indigo' }, // Changed blue to indigo
              { label: 'Pending', value: 'pending', color: 'yellow' },
              { label: 'Approved', value: 'approved', color: 'green' },
              { label: 'Rejected', value: 'rejected', color: 'red' },
            ].map(filter => (
              <button 
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)} 
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 ${
                  statusFilter === filter.value 
                    ? `bg-${filter.color}-600 text-white shadow-lg` // Enhanced shadow
                    : `bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-gray-400`
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-5">
          <span className="text-sm text-gray-600 font-medium">
            {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} found
          </span>
          <button 
            onClick={fetchRequests}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center font-medium p-1 rounded hover:bg-indigo-50 transition-colors" // Changed blue to indigo
            disabled={loading}
          >
            <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> {/* Larger spinner, indigo color */}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center text-gray-500 py-16"> {/* Increased padding */}
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"> {/* Larger icon */}
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-700"> {/* Increased font size/weight */}
              {error ? 'Unable to load requests' : 'No requests found'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {error ? 'Please try refreshing.' : 'There are no skill verification requests matching your criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => {
                  setSelectedRequest(request);
                  setFeedback(request.feedback || ''); 
                }}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ease-in-out border ${
                  selectedRequest?.id === request.id
                    ? 'bg-indigo-100 border-indigo-300 shadow-lg scale-[1.02]' // Enhanced selected state
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md hover:border-gray-300' // Enhanced hover state
                }`}
              >
                <div className="flex text-gray-800 items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 shadow-inner border-2 border-white"> {/* Added border */}
                      {request.user?.avatar ? (
                        <img
                          src={request.user.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-200 to-purple-200 text-indigo-700 font-semibold text-lg"> {/* Adjusted gradient */}
                          {getUserDisplayName(request).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-base text-gray-900">{request.skillName}</h3> {/* Darker text */}
                      <p className="text-sm text-gray-600">
                        {getUserDisplayName(request)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Submitted: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm ${ // Added shadow
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : request.status === 'approved'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
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
      <div className="w-1/2 p-8">
        {selectedRequest ? (
          <div className="bg-white rounded-xl text-gray-800 shadow-xl p-8 sticky top-8 border border-gray-100"> {/* Enhanced shadow and border */}
            <h2 className="text-2xl font-bold mb-8 border-b pb-4 border-gray-200 text-gray-900 tracking-tight">Verification Request Details</h2> {/* Darker text, tracking */}
            
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden mr-5 shadow-lg border-4 border-white"> {/* Enhanced shadow/border */}
                  {selectedRequest.user?.avatar ? (
                    <img
                      src={selectedRequest.user.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-200 to-purple-200 text-indigo-700 font-semibold text-2xl"> {/* Adjusted gradient */}
                      {getUserDisplayName(selectedRequest).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{getUserDisplayName(selectedRequest)}</h3> {/* Darker text */}
                  {selectedRequest.user?.email && (
                    <p className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"><a href={`mailto:${selectedRequest.user.email}`}>{selectedRequest.user.email}</a></p> 
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</label>
                  <p className="mt-1 text-sm text-gray-700 font-mono">{selectedRequest.userId}</p> {/* Monospace for ID */}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Skill Name</label>
                  <p className="mt-1 font-semibold text-base text-indigo-700">{selectedRequest.skillName}</p> {/* Indigo color */}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Skill ID</label>
                  <p className="mt-1 text-sm text-gray-700 font-mono">{selectedRequest.skillId}</p> {/* Monospace for ID */}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                  <p className={`mt-1 font-semibold text-base ${
                    selectedRequest.status === 'pending'
                      ? 'text-yellow-600'
                      : selectedRequest.status === 'approved'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</label>
                  <p className="mt-1 text-sm text-gray-700">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded Documents</label>
                {selectedRequest.documents.length > 0 ? (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedRequest.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group"> {/* Indigo hover */}
                        <div className="flex items-center overflow-hidden mr-2">
                          <svg className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* Indigo color */}
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700 truncate group-hover:text-indigo-800 transition-colors">Document {index + 1}</span> {/* Indigo hover */}
                        </div>
                        <button
                          onClick={() => handleViewDocument(doc)}
                          disabled={documentLoading}
                          className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed rounded hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all" // Indigo colors
                        >
                          {documentLoading ? (
                            <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : 'View'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500 italic">No documents uploaded.</p>
                )}
              </div>

              {selectedRequest.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description/Notes</label>
                  <p className="mt-2 text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{selectedRequest.description}</p> {/* Added leading-relaxed */}
                </div>
              )}

              {/* Show feedback if status is rejected */}
              {selectedRequest.status === 'rejected' && selectedRequest.feedback && (
                <div>
                  <label className="block text-sm font-medium text-red-700">Admin Feedback (Rejection Reason)</label>
                  <p className="mt-2 text-red-800 bg-red-50 p-4 rounded-lg border border-red-200 text-sm whitespace-pre-wrap leading-relaxed">{selectedRequest.feedback}</p> {/* Added leading-relaxed */}
                </div>
              )}

              {/* Admin Feedback field for pending requests */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <label htmlFor="adminFeedback" className="block text-sm font-medium text-gray-700 mb-2">Admin Feedback (Required for Rejection)</label>
                  <textarea
                    id="adminFeedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide clear feedback, especially if rejecting the request."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-28 shadow-sm text-sm transition-shadow duration-150 focus:shadow-md" // Enhanced focus
                    rows={4}
                  />
                  <p className="mt-1 text-xs text-gray-500">This feedback will be shown to the user if the request is rejected.</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                    className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-150 ease-in-out transform hover:scale-105" // Enhanced styles
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                    disabled={!feedback.trim()} // Disable if feedback is empty
                    className={`flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white transition-all duration-150 ease-in-out transform hover:scale-105 ${
                      !feedback.trim() 
                        ? 'bg-red-300 cursor-not-allowed opacity-70' // Adjusted disabled style
                        : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                    }`}
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white/60 rounded-xl border-2 border-dashed border-gray-300 p-12"> {/* Adjusted background, border, padding */}
            <svg className="w-24 h-24 text-gray-300 mb-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* Larger icon */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xl font-medium text-gray-600">Select a request from the list</p> {/* Larger text */}
            <p className="text-sm text-gray-500 mt-2">Details will be shown here once a request is selected.</p>
          </div>
        )}
      </div>
    </div>
  );
}