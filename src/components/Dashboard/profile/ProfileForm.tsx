'use client';

import { useState, useEffect } from 'react';

export default function ProfileForm() {
  const [formState, setFormState] = useState({
    userId: '67e66f9d4c4a95f630b6235c', // Hardcoded test user ID - replace with actual ID
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

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/users/profile?id=${formState.userId}`);
        const data = await res.json();
        
        if (data.success && data.user) {
          setFormState(prev => ({
            ...prev,
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            title: data.user.title || '',
            avatarUrl: data.user.avatar || ''
          }));
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
  }, [formState.userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
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
        // Update local state with new avatar URL if it was changed
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

  if (isLoading) {
    return <div className="max-w-md mx-auto p-4 text-center">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border text-gray-800 rounded">
      <div className="flex items-center space-x-4">
        {formState.avatarUrl && (
          <img 
            src={formState.avatarUrl} 
            alt="Profile" 
            className="w-16 h-16 rounded-full object-cover"
          />
        )}
        <div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="w-full text-gray-800"
          />
          <p className="text-sm text-gray-500">Click to change profile picture</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input 
            name="firstName" 
            value={formState.firstName} 
            onChange={handleChange} 
            className="w-full text-gray-800 border p-2 rounded" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input 
            name="lastName" 
            value={formState.lastName} 
            onChange={handleChange} 
            className="w-full text-gray-800 border p-2 rounded" 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input 
          name="email" 
          type="email"
          value={formState.email} 
          onChange={handleChange} 
          className="w-full text-gray-800 border p-2 rounded" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input 
          name="phone" 
          type="tel"
          value={formState.phone} 
          onChange={handleChange} 
          className="w-full text-gray-800 border p-2 rounded" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input 
          name="title" 
          value={formState.title} 
          onChange={handleChange} 
          className="w-full text-gray-800 border p-2 rounded" 
        />
      </div>
      
      <button 
        type="submit" 
        disabled={isLoading}
        className={`w-full bg-blue-500 text-white px-4 py-2 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
      >
        {isLoading ? 'Updating...' : 'Update Profile'}
      </button>

      {message && (
        <p className={`mt-2 text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}