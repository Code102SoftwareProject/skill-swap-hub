import React, { useState, useEffect } from 'react';
import { X, Search, User, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import { processAvatarUrl, getFirstLetter } from "@/utils/avatarUtils";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  email: string;
}

interface CreateMeetingWithUserModalProps {
  onClose: () => void;
  onCreate: (meetingData: any, receiverId: string) => void;
  currentUserId: string;
}

export default function CreateMeetingWithUserModal({ 
  onClose, 
  onCreate,
  currentUserId 
}: CreateMeetingWithUserModalProps) {
  const [step, setStep] = useState<'selectUser' | 'createMeeting'>('selectUser');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fetch users when modal opens
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch('/api/User-managment');
        const users = await response.json();
        
        if (Array.isArray(users)) {
          // Filter out current user
          const filteredUsers = users.filter((user: User) => user._id !== currentUserId);
          setUsers(filteredUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search);
  });

  // Validate meeting form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      // No Past Dates
      const selectedDate = new Date(date + 'T' + (time || '00:00'));
      if (selectedDate < new Date()) {
        newErrors.date = 'Meeting date must be in the future';
      }
    }
    
    if (!time) {
      newErrors.time = 'Time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setStep('createMeeting');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && selectedUser) {
      onCreate({
        description,
        date,
        time
      }, selectedUser._id);
    }
  };

  const handleBack = () => {
    setStep('selectUser');
    setErrors({});
  };

  // Set min date to today
  const today = new Date().toISOString().split('T')[0];

  // User Avatar Component
  const UserAvatar = ({ user, size = 'md' }: { user: User, size?: 'sm' | 'md' | 'lg' }) => {
    const avatarUrl = processAvatarUrl(user.avatar);
    const firstLetter = getFirstLetter(user.firstName, user._id);
    const [imageError, setImageError] = useState(false);
    
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };

    return (
      <div className={`${sizeClasses[size]} bg-gray-200 rounded-full flex items-center justify-center overflow-hidden`}>
        {avatarUrl && !imageError ? (
          <Image
            src={avatarUrl}
            alt={`${user.firstName} ${user.lastName}`}
            width={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
            height={size === 'sm' ? 32 : size === 'md' ? 40 : 48}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={`${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'} font-medium text-gray-600`}>
            {firstLetter}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-2">
            {step === 'createMeeting' && (
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700 mr-2"
              >
                ←
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'selectUser' ? 'Select User' : 'Schedule Meeting'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {step === 'selectUser' ? (
            <>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm ? 'No users found matching your search' : 'No users available'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleUserSelect(user)}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <UserAvatar user={user} size="md" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Selected User */}
              {selectedUser && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={selectedUser} size="md" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Scheduling meeting with</p>
                      <p className="font-medium text-gray-900">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meeting Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description:
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="What's this meeting about?"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date:
                    </label>
                    <input
                      type="date"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={today}
                    />
                    {errors.date && (
                      <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Time:
                    </label>
                    <input
                      type="time"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.time ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                    {errors.time && (
                      <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule Meeting
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
