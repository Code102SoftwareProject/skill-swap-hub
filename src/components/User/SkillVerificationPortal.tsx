"use client"
import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import SkillDetailsModal from '../Popup/Skillrequestpopup';
interface VerificationRequest {
  _id: string;
  userId: string;
  skillName: string;
  status: 'Pending' | 'Verified';
  documents: string[];
  description: string;
  createdAt: Date;
}

const SkillVerificationPortal: React.FC<{ userId: string }> = ({ userId }) => {
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // Fetch verification requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get<{ data: VerificationRequest[] }>(`/api/users/verification-request?userId=${userId}`);
        setRequests(response.data.data); 
      } catch (err) {
        const error = err as AxiosError;
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
  }, [userId]);

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

  // Upload single file
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      },
    });

    if (!response.data.url) {
      throw new Error('Failed to upload file');
    }

    return response.data.url;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      if (!skillName.trim()) {
        throw new Error('Skill name is required');
      }

      if (documents.length === 0) {
        throw new Error('Please upload at least one document');
      }

      // Upload all documents sequentially
      const documentUrls = [];
      for (const file of documents) {
        const url = await uploadFile(file);
        documentUrls.push(url);
      }

      // Submit verification request with document URLs
      const response = await axios.post<{ data: VerificationRequest }>('/api/users/verification-request', {
        userId,
        skillName: skillName.trim(),
        documents: documentUrls,
        description: description.trim(),
      });

      setRequests(prev => [response.data.data, ...prev]);

      // Reset form
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
      const error = err as AxiosError;
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
  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-2">Skill Verification Portal</h1>
      <p className="text-gray-600 text-center mb-8">Verify and showcase your professional skills</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xl font-semibold block mb-2">Skill Name</label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-xl font-semibold block mb-2">Upload Verification Documents</label>
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
              <label className="text-xl font-semibold block mb-2">Additional Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border rounded-lg shadow-sm h-32 focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-900 text-white py-3 rounded-lg flex items-center justify-center space-x-2 
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-800'}`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Verification Request'}</span>
            </button>
          </form>
        </div>

        {/* Verification Requests List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Your Verification Requests</h2>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No verification requests yet</p>
            ) : (
              requests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: request.status === 'Pending' ? '#0A4D8C' : '#4A7997',
                  }}
                  onClick={() => handleRequestClick(request)}
                >
                  <span className="text-white font-medium">{request.skillName}</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-sm
                        ${request.status === 'Pending' ? 'bg-orange-500' : 'bg-green-500'}`}
                    >
                      {request.status}
                    </span>
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