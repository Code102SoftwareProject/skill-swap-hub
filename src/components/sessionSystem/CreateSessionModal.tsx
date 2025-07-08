"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, User, BookOpen } from 'lucide-react';
import Alert from '@/components/ui/Alert';

interface UserSkill {
  id: string;
  skillTitle: string;
  proficiencyLevel: string;
  description: string;
  categoryName: string;
}

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  chatRoomId: string;
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  currentUserId,
  otherUserId,
  otherUserName,
  chatRoomId
}: CreateSessionModalProps) {
  const [currentUserSkills, setCurrentUserSkills] = useState<UserSkill[]>([]);
  const [otherUserSkills, setOtherUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedMySkill, setSelectedMySkill] = useState<string>('');
  const [myDescription, setMyDescription] = useState<string>('');
  const [selectedOtherSkill, setSelectedOtherSkill] = useState<string>('');
  const [otherDescription, setOtherDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Alert state
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  // Helper function for alerts
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setAlert({
      isOpen: true,
      type,
      message,
      title
    });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  // Fetch skills when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserSkills();
      // Set default start date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setStartDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen, currentUserId, otherUserId]);

  const fetchUserSkills = async () => {
    setLoading(true);
    try {
      // Fetch current user skills
      const currentUserResponse = await fetch(`/api/skillsbyuser?userId=${currentUserId}`);
      const currentUserData = await currentUserResponse.json();
      
      // Fetch other user skills
      const otherUserResponse = await fetch(`/api/skillsbyuser?userId=${otherUserId}`);
      const otherUserData = await otherUserResponse.json();

      if (currentUserData.success) {
        setCurrentUserSkills(currentUserData.skills);
      }
      
      if (otherUserData.success) {
        setOtherUserSkills(otherUserData.skills);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!selectedMySkill) newErrors.mySkill = 'Please select a skill you want to offer';
    if (!myDescription.trim()) newErrors.myDescription = 'Please describe what you will provide';
    if (myDescription.trim().length < 10) newErrors.myDescription = 'Description must be at least 10 characters';
    
    if (!selectedOtherSkill) newErrors.otherSkill = 'Please select a skill you want to learn';
    if (!otherDescription.trim()) newErrors.otherDescription = 'Please describe what you want to learn';
    if (otherDescription.trim().length < 10) newErrors.otherDescription = 'Description must be at least 10 characters';
    
    if (!startDate) newErrors.startDate = 'Please select a start date';
    
    // Check if start date is in the future
    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      newErrors.startDate = 'Start date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user1Id: currentUserId,
          skill1Id: selectedMySkill,
          descriptionOfService1: myDescription.trim(),
          user2Id: otherUserId,
          skill2Id: selectedOtherSkill,
          descriptionOfService2: otherDescription.trim(),
          startDate: new Date(startDate).toISOString()
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setSelectedMySkill('');
        setMyDescription('');
        setSelectedOtherSkill('');
        setOtherDescription('');
        setStartDate('');
        setErrors({});
        
        // Close modal
        onClose();
        
        // You might want to trigger a refresh of sessions or show a success message
        showAlert('success', 'Session request sent successfully!');
      } else {
        showAlert('error', data.message || 'Failed to create session request');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      showAlert('error', 'Failed to create session request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedMySkill('');
    setMyDescription('');
    setSelectedOtherSkill('');
    setOtherDescription('');
    setStartDate('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Session Request with {otherUserName}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading skills...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* What you offer section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">What You Will Offer</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Skill
                </label>
                <select
                  value={selectedMySkill}
                  onChange={(e) => setSelectedMySkill(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a skill to offer...</option>
                  {currentUserSkills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.skillTitle} ({skill.proficiencyLevel}) - {skill.categoryName}
                    </option>
                  ))}
                </select>
                {errors.mySkill && <p className="text-red-500 text-sm mt-1">{errors.mySkill}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe What You Will Provide
                </label>
                <textarea
                  value={myDescription}
                  onChange={(e) => setMyDescription(e.target.value)}
                  placeholder="Describe what you will teach, how you'll help, session format, etc..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.myDescription && <p className="text-red-500 text-sm mt-1">{errors.myDescription}</p>}
              </div>
            </div>

            {/* What you want section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900">What You Want to Learn</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {otherUserName}'s Skill
                </label>
                <select
                  value={selectedOtherSkill}
                  onChange={(e) => setSelectedOtherSkill(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a skill to learn...</option>
                  {otherUserSkills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.skillTitle} ({skill.proficiencyLevel}) - {skill.categoryName}
                    </option>
                  ))}
                </select>
                {errors.otherSkill && <p className="text-red-500 text-sm mt-1">{errors.otherSkill}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe What You Want to Learn
                </label>
                <textarea
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  placeholder="Describe what you want to learn, your current level, specific goals, etc..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.otherDescription && <p className="text-red-500 text-sm mt-1">{errors.otherDescription}</p>}
              </div>
            </div>

            {/* Start date */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Start Date
                </label>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Sending...' : 'Send Session Request'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Alert Component */}
      <Alert
        type={alert.type}
        title={alert.title}
        message={alert.message}
        isOpen={alert.isOpen}
        onClose={closeAlert}
        showCloseButton={true}
        autoClose={false}
      />
    </div>
  );
}