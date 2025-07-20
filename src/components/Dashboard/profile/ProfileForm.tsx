//Profile Form component
// This component is responsible for displaying and editing the user's profile information.
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext'; // Update the path if different
import Image from 'next/image';


export default function ProfileForm() {
  const { user } = useAuth();

  const [formState, setFormState] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '', 
    title: '',
    avatarUrl: ''
  });

  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch data after user is available
  useEffect(() => {
    if (!user?._id) return;

    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/users/profile?id=${user._id}`);
        const data = await res.json();

        if (data.success && data.user) {
          setFormState({
            userId: user._id,
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            title: data.user.title || '',
            avatarUrl: data.user.avatar || ''
          });
        } else {
          setMessage(data.message || 'Failed to fetch user data');
        }
      } catch (err) {
        console.error(err);
        setMessage('Error while fetching profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user?._id]); // triggers when user is ready

  // Rest of your code remains the same...


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormState(prev => ({ ...prev, avatarUrl: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('userId', formState.userId);
    formData.append('firstName', formState.firstName);
    formData.append('lastName', formState.lastName);
    formData.append('email', formState.email);
    formData.append('phone', formState.phone);
    formData.append('title', formState.title);
    if (avatar) formData.append('avatar', avatar);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        if (data.user.avatar) {
          setFormState(prev => ({ ...prev, avatarUrl: data.user.avatar }));
        }
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!user?._id) return;
      try {
        const res = await fetch(`/api/kyc/status?userId=${user._id}`);
        const data = await res.json();

        if (data.success) {
          setKycStatus(data.status);
          if (data.status === 'Rejected') {
            setKycRejectionReason(data.reason || 'No reason provided');
          } else {
            setKycRejectionReason(null);
          }
        } else {
          setKycStatus(null);
          setKycRejectionReason(null);
        }
      } catch (err) {
        console.error('Failed to fetch KYC status:', err);
        setKycStatus(null);
        setKycRejectionReason(null);
      }
    };

    fetchKycStatus();
  }, [user?._id]);


  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="animate-pulse space-y-8">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Profile Information</h1>
          <p className="text-gray-500 mt-1">Manage your personal and professional details</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#026aa1] rounded-lg hover:bg-[#015a8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#026aa1]/50 transition-all duration-200 shadow-sm"
          >
            Edit Profile
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
              <Image
                src={
                  formState.avatarUrl
                    ? `/api/file/retrieve?fileUrl=${encodeURIComponent(formState.avatarUrl)}`
                    : '/default-avatar.png'
                }
                alt="Profile"
                width={200} // Replace with actual width
                height={200} // Replace with actual height
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 rounded-full">
                  <label className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                    <div className="bg-white/90 hover:bg-white text-[#026aa1] rounded-full p-2 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {formState.firstName} {formState.lastName}
            </h2>
            <p className="text-gray-600 mt-1">{formState.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
            {isEditing ? (
              <input 
                name="firstName" 
                value={formState.firstName} 
                onChange={handleChange} 
                placeholder="Enter your first name"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent placeholder-gray-500 transition-all duration-200"
                required
              />
            ) : (
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                {formState.firstName || <span className="text-gray-500">Not provided</span>}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
            {isEditing ? (
              <input 
                name="lastName" 
                value={formState.lastName} 
                onChange={handleChange} 
                placeholder="Enter your last name"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent placeholder-gray-500 transition-all duration-200"
                required
              />
            ) : (
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                {formState.lastName || <span className="text-gray-500">Not provided</span>}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            {isEditing ? (
              <input 
                name="email" 
                type="email"
                value={formState.email} 
                onChange={handleChange} 
                placeholder="Enter your email address"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent placeholder-gray-500 transition-all duration-200"
                required
              />
            ) : (
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                {formState.email || <span className="text-gray-500">Not provided</span>}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            {isEditing ? (
              <input 
                name="phone" 
                type="tel"
                value={formState.phone} 
                onChange={handleChange} 
                placeholder="Enter your phone number"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent placeholder-gray-500 transition-all duration-200"
              />
            ) : (
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                {formState.phone || <span className="text-gray-500">Not provided</span>}
              </div>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Title</label>
            {isEditing ? (
              <input 
                name="title" 
                value={formState.title} 
                onChange={handleChange} 
                placeholder="Enter your professional title"
                className="w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent placeholder-gray-500 transition-all duration-200"
              />
            ) : (
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                {formState.title || <span className="text-gray-500">Not provided</span>}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end pt-6 border-t border-gray-200 space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
            >
              Discard Changes
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#026aa1] rounded-lg hover:bg-[#015a8a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#026aa1]/50 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center">
              {message.includes('success') ? (
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span>{message}</span>
            </div>
          </div>
        )}
      </form>

{/* Enhanced KYC Status UI */}
<div className="mt-8 space-y-4">
  {(kycStatus === 'Accepted' || kycStatus === 'Approved') && (
    <div className="animate-fade-in">
      <div className="inline-flex items-center px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-lg font-medium text-sm shadow-sm">
        {/* Green verified tick icon */}
        <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>KYC Verified</span>
      </div>
      <p className="mt-2 text-sm text-green-600">Your identity verification is complete.</p>
    </div>
  )}

  {kycStatus === "Not Reviewed" && (
    <div className="animate-fade-in">
      <div className="inline-flex items-center px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg font-medium text-sm shadow-sm">
        <svg className="w-5 h-5 mr-2 text-yellow-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>KYC Under Review</span>
      </div>
      <p className="mt-2 text-sm text-yellow-600">We're verifying your documents. This typically takes 1-2 business days.</p>
    </div>
  )}

  {kycStatus === 'Rejected' && (
    <div className="animate-fade-in">
      <div className="inline-flex items-center px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-lg font-medium text-sm shadow-sm">
        <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span>KYC Rejected</span>
      </div>
      <div className="mt-3 p-4 bg-red-50 rounded-lg border border-red-100">
        <h4 className="font-medium text-red-800 text-sm mb-2">Reason for rejection:</h4>
        <p className="text-red-700 text-sm mb-3">{kycRejectionReason || 'No reason provided'}</p>
        <a
          href="/user/kyc"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Resubmit KYC
        </a>
      </div>
    </div>
  )}

  {kycStatus === null && (
    <div className="animate-fade-in">
      <div className="inline-flex items-center px-4 py-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg font-medium text-sm shadow-sm">
        <svg className="w-5 h-5 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>Identity Not Verified</span>
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="font-medium text-blue-800 text-sm mb-2">Verification required</h4>
        <p className="text-blue-700 text-sm mb-3">Complete KYC to access all platform features.</p>
        <a
          href="/user/kyc"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
          </svg>
          Start Verification
        </a>
      </div>
    </div>
  )}
</div>

    </div>
  );
}