"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Calendar, User, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import Alert from '@/components/ui/Alert';

interface UserSkill {
  _id: string;
  skillTitle: string;
  proficiencyLevel: string;
  description: string;
  categoryName: string;
  isVerified: boolean;
}

// Simple cache for skills to avoid refetching
const skillsCache = new Map<string, { skills: UserSkill[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  chatRoomId: string;
  activeSessionCount?: number;
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  currentUserId,
  otherUserId,
  otherUserName,
  chatRoomId,
  activeSessionCount = 0
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
  const [expectedEndDate, setExpectedEndDate] = useState<string>('');
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

  const fetchUserSkills = useCallback(async () => {
    setLoading(true);
    try {
      const now = Date.now();
      
      // Check cache first
      const currentUserCacheKey = `skills_${currentUserId}`;
      const otherUserCacheKey = `skills_${otherUserId}`;
      
      const currentUserCached = skillsCache.get(currentUserCacheKey);
      const otherUserCached = skillsCache.get(otherUserCacheKey);
      
      // Use cached data if available and not expired
      const shouldFetchCurrentUser = !currentUserCached || (now - currentUserCached.timestamp > CACHE_DURATION);
      const shouldFetchOtherUser = !otherUserCached || (now - otherUserCached.timestamp > CACHE_DURATION);
      
      if (!shouldFetchCurrentUser && !shouldFetchOtherUser) {
        // Both are cached, use cached data
        setCurrentUserSkills(currentUserCached!.skills);
        setOtherUserSkills(otherUserCached!.skills);
        setLoading(false);
        return;
      }
      
      // Prepare fetch promises
      const fetchPromises = [];
      
      if (shouldFetchCurrentUser) {
        fetchPromises.push(
          fetch(`/api/skillsbyuser?userId=${currentUserId}`)
            .then(res => res.json())
            .then(data => ({ type: 'current', data }))
        );
      } else {
        setCurrentUserSkills(currentUserCached!.skills);
      }
      
      if (shouldFetchOtherUser) {
        fetchPromises.push(
          fetch(`/api/skillsbyuser?userId=${otherUserId}`)
            .then(res => res.json())
            .then(data => ({ type: 'other', data }))
        );
      } else {
        setOtherUserSkills(otherUserCached!.skills);
      }
      
      // Fetch only what's needed
      if (fetchPromises.length > 0) {
        const results = await Promise.all(fetchPromises);
        
        results.forEach((result: any) => {
          if (result.data.success) {
            if (result.type === 'current') {
              setCurrentUserSkills(result.data.skills);
              // Cache the result
              skillsCache.set(currentUserCacheKey, {
                skills: result.data.skills,
                timestamp: now
              });
            } else if (result.type === 'other') {
              setOtherUserSkills(result.data.skills);
              // Cache the result
              skillsCache.set(otherUserCacheKey, {
                skills: result.data.skills,
                timestamp: now
              });
            }
          }
        });
      }
      
    } catch (error) {
      console.error('Error fetching skills:', error);
      showAlert('error', 'Failed to load skills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, otherUserId]);

  // Fetch skills when modal opens
  useEffect(() => {
    if (isOpen) {
      // Only fetch if we don't have skills data or user IDs changed
      if (currentUserSkills.length === 0 || otherUserSkills.length === 0) {
        fetchUserSkills();
      }
      
      // Set default dates only if not already set
      if (!startDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setStartDate(tomorrow.toISOString().split('T')[0]);
      }
      
      if (!expectedEndDate) {
        const defaultEndDate = new Date();
        defaultEndDate.setDate(defaultEndDate.getDate() + 31);
        setExpectedEndDate(defaultEndDate.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, fetchUserSkills, currentUserSkills.length, otherUserSkills.length, startDate, expectedEndDate]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!selectedMySkill) newErrors.mySkill = 'Please select a skill you want to offer';
    if (!myDescription.trim()) newErrors.myDescription = 'Please describe what you will provide';
    if (myDescription.trim().length < 10) newErrors.myDescription = 'Description must be at least 10 characters';

    if (!selectedOtherSkill) newErrors.otherSkill = 'Please select a skill you want to be offered';
    if (!otherDescription.trim()) newErrors.otherDescription = 'Please describe what you want to be offerd';
    if (otherDescription.trim().length < 10) newErrors.otherDescription = 'Description must be at least 10 characters';
    
    if (!startDate) newErrors.startDate = 'Please select a start date';
    if (!expectedEndDate) newErrors.expectedEndDate = 'Please select an expected end date';
    
    // Check if start date is in the future
    const selectedStartDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedStartDate <= today) {
      newErrors.startDate = 'Start date must be in the future';
    }
    
    // Check if expected end date is after start date
    const selectedEndDate = new Date(expectedEndDate);
    if (selectedEndDate <= selectedStartDate) {
      newErrors.expectedEndDate = 'Expected end date must be after start date';
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
          startDate: new Date(startDate).toISOString(),
          expectedEndDate: new Date(expectedEndDate).toISOString()
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
        setExpectedEndDate('');
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
    setExpectedEndDate('');
    setErrors({});
    onClose();
  };

  // Memoized skill list components for better performance
  const CurrentUserSkillsList = useMemo(() => (
    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
      {currentUserSkills.length === 0 ? (
        <p className="text-gray-500 text-sm p-2">No skills available</p>
      ) : (
        currentUserSkills.map((skill) => (
          <div
            key={skill._id}
            onClick={() => setSelectedMySkill(skill._id)}
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedMySkill === skill._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{skill.skillTitle}</span>
                {skill.isVerified ? (
                  <span title="Verified Skill">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </span>
                ) : (
                  <span title="Unverified Skill">
                    <XCircle className="h-4 w-4 text-gray-400" />
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {skill.proficiencyLevel} • {skill.categoryName}
              </div>
              {skill.description && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {skill.description}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  ), [currentUserSkills, selectedMySkill]);

  const OtherUserSkillsList = useMemo(() => (
    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
      {otherUserSkills.length === 0 ? (
        <p className="text-gray-500 text-sm p-2">No skills available</p>
      ) : (
        otherUserSkills.map((skill) => (
          <div
            key={skill._id}
            onClick={() => setSelectedOtherSkill(skill._id)}
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedOtherSkill === skill._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{skill.skillTitle}</span>
                {skill.isVerified ? (
                  <span title="Verified Skill">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </span>
                ) : (
                  <span title="Unverified Skill">
                    <XCircle className="h-4 w-4 text-gray-400" />
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {skill.proficiencyLevel} • {skill.categoryName}
              </div>
              {skill.description && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {skill.description}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  ), [otherUserSkills, selectedOtherSkill]);

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
            {/* Active session limit info */}
            {activeSessionCount > 0 && (
              <div className={`p-3 rounded-lg ${activeSessionCount >= 3 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <p className={`text-sm ${activeSessionCount >= 3 ? 'text-red-700' : 'text-yellow-700'}`}>
                  <span className="font-medium">
                    {activeSessionCount >= 3 
                      ? '⚠️ Session Limit Reached' 
                      : `📝 Active Sessions: ${activeSessionCount}/3`
                    }
                  </span>
                  <br />
                  {activeSessionCount >= 3 
                    ? 'You have reached the maximum of 3 active sessions (pending + active) between you and this user. Please wait for existing sessions to be completed before creating new requests.'
                    : `You can create ${3 - activeSessionCount} more session${3 - activeSessionCount === 1 ? '' : 's'} with ${otherUserName}.`
                  }
                </p>
              </div>
            )}

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
                {CurrentUserSkillsList}
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
                <h3 className="text-lg font-medium text-gray-900">What You Want to Recive</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {otherUserName}'s Skill
                </label>
                {OtherUserSkillsList}
                {errors.otherSkill && <p className="text-red-500 text-sm mt-1">{errors.otherSkill}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe What You Want to Receive
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
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>

            {/* Expected end date */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <label className="block text-sm font-medium text-gray-700">
                  Expected End Date
                </label>
              </div>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.expectedEndDate && <p className="text-red-500 text-sm mt-1">{errors.expectedEndDate}</p>}
              <p className="text-sm text-gray-600 mt-1">
                This helps both participants plan and track session progress
              </p>
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
                disabled={submitting || activeSessionCount >= 3}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  submitting || activeSessionCount >= 3
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={activeSessionCount >= 3 ? 'You have reached the maximum of 3 active sessions between you and this user' : ''}
              >
                {submitting ? 'Sending...' : 
                 activeSessionCount >= 3 ? 'Session Limit Reached' : 
                 'Send Session Request'}
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