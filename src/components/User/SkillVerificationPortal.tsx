"use client"
import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, Trash2 } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import SkillDetailsModal from '../Popup/Skillrequestpopup';
import { useAuth } from '@/lib/context/AuthContext';

interface UserSkill {
  id: string;
  skillTitle: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Expert';
  isVerified: boolean;
}

interface VerificationRequest {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  status: 'pending' | 'approved' | 'rejected' ;
  documents: string[];
  description: string;
  feedback?: string;
  createdAt: Date;
}

const SkillVerificationPortal: React.FC = () => {
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { user, token } = useAuth();

  // Get userId from the auth context
  const userId = user?._id || '';

  // Configure axios with authorization header
  const getAuthConfig = () => {
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Fetch user skills
  useEffect(() => {
    const fetchUserSkills = async () => {
      if (!userId || !token) return;
      
      try {
        const response = await axios.get<{ success: boolean, data: UserSkill[] }>(
          '/api/myskills', 
          getAuthConfig()
        );
        setUserSkills(response.data.data);
      } catch (err) {
        console.error('Error fetching skills:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch your skills',
          confirmButtonColor: '#1e3a8a'
        });
        setUserSkills([]);
      }
    };

    fetchUserSkills();
  }, [userId, token]);

  // Fetch verification requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!userId || !token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get<{ data: VerificationRequest[] }>(
          `/api/users/verification-request?userId=${userId}`,
          getAuthConfig()
        );
        console.log(response.data.data);
        setRequests(response.data.data); 
     
      } catch (err) {
        console.error('Error fetching verification requests:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch verification requests',
          confirmButtonColor: '#1e3a8a'
        });
        setRequests([]); 
      } finally {
        setLoading(false);
      }
    };
  
    fetchRequests();
  }, [userId, token]);

  // Handle skill selection
  const handleSkillSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skillId = e.target.value;
    setSelectedSkillId(skillId);
    
    if (skillId) {
      const selectedSkill = userSkills.find(skill => skill.id === skillId);
      if (selectedSkill) {
        setSkillName(selectedSkill.skillTitle);
      }
    } else {
      setSkillName('');
    }
  };

  // Upload single file
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(Math.round(progress));
          }
        },
        // Add these options for formidable compatibility
        transformRequest: [
          (data, headers) => {
            // Don't convert FormData to JSON
            return data;
          },
        ],
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      if (!response.data.url) {
        throw new Error('Failed to upload file');
      }

      return response.data.url;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload file');
    }
  };

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid File Type',
            text: 'Only PDF, JPG, and PNG files are allowed.',
            confirmButtonColor: '#1e3a8a'
          });
          return false;
        }

        if (file.size > maxSize) {
          Swal.fire({
            icon: 'error',
            title: 'File Too Large',
            text: 'File size exceeds 10MB limit.',
            confirmButtonColor: '#1e3a8a'
          });
          return false;
        }
        return true;
      });

      setDocuments(validFiles);
      if (validFiles.length > 0) {
        Swal.fire({
          icon: 'success',
          title: 'Files Added',
          text: `${validFiles.length} file(s) successfully selected`,
          confirmButtonColor: '#1e3a8a',
          timer: 1500
        });
      }
    }
  };

  // Check if a skill already has a pending verification request
  const hasActiveRequest = (skillId: string): boolean => {
    return requests.some(req => 
      req.skillId === skillId && req.status === 'pending'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
  
    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'You need to be logged in to submit verification requests',
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }
  
    try {
      setIsSubmitting(true);
      setUploadProgress(0);
  
      if (!selectedSkillId) {
        throw new Error('Please select a skill to verify');
      }
  
      if (hasActiveRequest(selectedSkillId)) {
        throw new Error('This skill already has a pending verification request');
      }
  
      if (documents.length === 0) {
        throw new Error('Please upload at least one document');
      }
  
      // Upload all documents sequentially
      const documentUrls = [];
      for (const file of documents) {
        try {
          const url = await uploadFile(file);
          documentUrls.push(url);
        } catch (error) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
  
      // Log for debugging - can be removed after fix is confirmed
      console.log('Submitting verification request with skill ID:', selectedSkillId);
  
      // Submit verification request with document URLs
      const response = await axios.post<{ data: VerificationRequest }>(
        '/api/users/verification-request', 
        {
          userId,
          skillId: selectedSkillId, // Ensure skillId is properly included
          skillName: skillName.trim(),
          documents: documentUrls,
          description: description.trim(),
        },
        getAuthConfig()
      );
  
      setRequests(prev => [response.data.data, ...prev]);
  
      // Reset form
      setSelectedSkillId('');
      setSkillName('');
      setDescription('');
      setDocuments([]);
      setUploadProgress(0);
  
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Verification request submitted successfully',
        confirmButtonColor: '#1e3a8a',
        timer: 2000
      });
  
    } catch (err) {
      const error = err as Error;
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.message || 'Failed to submit verification request',
        confirmButtonColor: '#1e3a8a'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestClick = (request: VerificationRequest) => {
    setSelectedRequest(request);
  };

  // Handle delete verification request
  const handleDeleteRequest = async (requestId: string, event: React.MouseEvent) => {
    // Prevent the click from triggering the parent element's onClick
    event.stopPropagation();
    
    // Log for debugging
    console.log('Deleting request with ID:', requestId);
    
    if (!requestId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Invalid request ID',
        confirmButtonColor: '#1e3a8a'
      });
      return;
    }
    
    try {
      // Confirm before deleting
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This verification request will be permanently deleted.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e3a8a',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });
      
      if (result.isConfirmed) {
        // Make sure requestId is properly defined before making the API call
        await axios.delete(
          `/api/users/verification-request?requestId=${requestId}&userId=${userId}`,
          getAuthConfig()
        );
        
        // Update the requests state
        setRequests(prev => prev.filter(req => req.id !== requestId));
        
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Verification request has been deleted.',
          confirmButtonColor: '#1e3a8a',
          timer: 1500
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      const axiosError = error as AxiosError;
      let errorMessage = 'Failed to delete verification request';
      
      if (axiosError.response?.status === 403) {
        errorMessage = 'Only accepted verification requests can be deleted';
      } else if (axiosError.response?.status === 404) {
        errorMessage = 'Verification request not found';
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#1e3a8a'
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  // Display login message if user is not authenticated
  if (!userId) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h1 className="text-4xl text-black font-bold mb-4">Skill Verification Portal</h1>
        <p className="text-lg text-black mb-6">Please log in to access the skill verification portal</p>
      </div>
    );
  }

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

  // Helper function to get card background color
  const getCardBackgroundColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#0A4D8C';
      case 'approved':
        return '#1B5E20';
      case 'rejected':
        return '#B71C1C';
      default:
        return '#4A7997';
    }
  };

  // Check if request can be deleted (only if status is "accepted")
  const canDeleteRequest = (status: string): boolean => {
    return status.toLowerCase() === 'approved';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl text-black font-bold text-center mb-2">Skill Verification Portal</h1>
      <p className="text-black text-center mb-8">Verify and showcase your professional skills</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xl text-black font-semibold block mb-2">Select Skill to Verify</label>
              <select
                value={selectedSkillId}
                onChange={handleSkillSelect}
                className="w-full p-3 border text-black rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                <option value="">-- Select a skill --</option>
                {userSkills
                  .filter(skill => !skill.isVerified)
                  .map(skill => (
                    <option 
                      key={skill.id} 
                      value={skill.id}
                      disabled={hasActiveRequest(skill.id)}
                    >
                      {skill.skillTitle} ({skill.proficiencyLevel})
                      {hasActiveRequest(skill.id) ? ' - Pending Verification' : ''}
                    </option>
                  ))
                }
              </select>
              {userSkills.length === 0 && (
                <p className="mt-2 text-sm text-red-500">
                  You haven't added any skills yet. Please add skills in your profile before requesting verification.
                </p>
              )}
            </div>

            <div>
              <label className="text-xl text-black font-semibold block mb-2">Upload Verification Documents</label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !isSubmitting && document.getElementById('fileInput')?.click()}
              >
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {documents.length > 0 
                    ? `${documents.length} file(s) selected` 
                    : 'Drag and drop or click to upload certificates, IDs, etc.'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, JPG, PNG (Max 10MB)
                </p>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/*upload progress indicator */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="w-full mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1 text-center">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}

            <div>
              <label className="text-xl text-black font-semibold block mb-2">Additional Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border text-black rounded-lg shadow-sm h-32 focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                placeholder="Provide details about your experience, certifications, or any other relevant information"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedSkillId}
              className={`w-full bg-blue-900 text-white py-3 rounded-lg flex items-center justify-center space-x-2 
                ${(isSubmitting || !selectedSkillId) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-800'}`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Verification Request'}</span>
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl text-black font-bold mb-4">Your Verification Requests</h2>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No verification requests yet</p>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity relative"
                  style={{
                    backgroundColor: getCardBackgroundColor(request.status)
                  }}
                  onClick={() => handleRequestClick(request)}
                >
                  <span className="text-white font-medium">{request.skillName}</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(request.status)}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    
                    {/* Delete button - only shown for accepted requests */}
                    {canDeleteRequest(request.status) && (
                      <button
                        onClick={(e) => handleDeleteRequest(request.id, e)}
                        className="ml-2 p-1 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
                        title="Delete verification request"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {selectedRequest && (
        <SkillDetailsModal
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default SkillVerificationPortal;