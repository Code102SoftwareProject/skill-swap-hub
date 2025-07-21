"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, User, BookOpen, MessageSquare } from 'lucide-react';
import Alert from '@/components/ui/Alert';

interface UserSkill {
  _id: string;
  id?: string;
  skillTitle: string;
  proficiencyLevel: string;
  categoryName: string;
}

interface UserProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface Session {
  _id: string;
  user1Id: UserProfile;
  user2Id: UserProfile;
  skill1Id: any;
  skill2Id: any;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  expectedEndDate?: string;
}

interface CounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  currentUserId: string;
  onCounterOfferCreated: () => void;
}

export default function CounterOfferModal({ 
  isOpen, 
  onClose, 
  session, 
  currentUserId,
  onCounterOfferCreated 
}: CounterOfferModalProps) {
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [otherUserSkills, setOtherUserSkills] = useState<UserSkill[]>([]);
  const [selectedUserSkill, setSelectedUserSkill] = useState('');
  const [selectedOtherSkill, setSelectedOtherSkill] = useState('');
  const [userDescription, setUserDescription] = useState('');
  const [otherDescription, setOtherDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [counterOfferMessage, setCounterOfferMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);

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

  const fetchSkills = useCallback(async () => {
    if (!session) return;
    
    setSkillsLoading(true);
    try {
      // Fetch current user's skills
      const userSkillsResponse = await fetch(`/api/skillsbyuser?userId=${currentUserId}`);
      const userSkillsData = await userSkillsResponse.json();
      
      // Fetch other user's skills
      const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
      const otherSkillsResponse = await fetch(`/api/skillsbyuser?userId=${otherUserId}`);
      const otherSkillsData = await otherSkillsResponse.json();

      if (userSkillsData.success) {
        console.log('User skills for counter offer:', userSkillsData.skills); // Debug log
        setUserSkills(userSkillsData.skills);
      }
      
      if (otherSkillsData.success) {
        console.log('Other user skills for counter offer:', otherSkillsData.skills); // Debug log
        setOtherUserSkills(otherSkillsData.skills);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setSkillsLoading(false);
    }
  }, [session, currentUserId]);

  useEffect(() => {
    if (isOpen && session) {
      console.log('Session data for counter offer:', session); // Debug log
      
      // Pre-populate form with current session data
      const isUser1 = session.user1Id._id === currentUserId;
      
      // Extract skill IDs properly
      let skill1Id = '';
      let skill2Id = '';
      
      if (session.skill1Id) {
        if (typeof session.skill1Id === 'string') {
          skill1Id = session.skill1Id;
        } else if (session.skill1Id.id) {
          skill1Id = session.skill1Id.id;
        } else if (session.skill1Id._id) {
          skill1Id = session.skill1Id._id;
        } else if (session.skill1Id.toString) {
          skill1Id = session.skill1Id.toString();
        }
      }
      
      if (session.skill2Id) {
        if (typeof session.skill2Id === 'string') {
          skill2Id = session.skill2Id;
        } else if (session.skill2Id.id) {
          skill2Id = session.skill2Id.id;
        } else if (session.skill2Id._id) {
          skill2Id = session.skill2Id._id;
        } else if (session.skill2Id.toString) {
          skill2Id = session.skill2Id.toString();
        }
      }
      
      console.log('Extracted skill IDs for counter offer:', { skill1Id, skill2Id, isUser1 }); // Debug log
      
      if (isUser1) {
        setSelectedUserSkill(skill1Id || '');
        setSelectedOtherSkill(skill2Id || '');
        setUserDescription(session.descriptionOfService1);
        setOtherDescription(session.descriptionOfService2);
      } else {
        setSelectedUserSkill(skill2Id || '');
        setSelectedOtherSkill(skill1Id || '');
        setUserDescription(session.descriptionOfService2);
        setOtherDescription(session.descriptionOfService1);
      }
      
      setStartDate(session.startDate.split('T')[0]);
      
      // Set expectedEndDate from session or default to 1 month after start date
      if (session.expectedEndDate) {
        setExpectedEndDate(session.expectedEndDate.split('T')[0]);
      } else {
        const startDateObj = new Date(session.startDate);
        const defaultEndDate = new Date(startDateObj);
        defaultEndDate.setMonth(defaultEndDate.getMonth() + 1); // Add 1 month
        setExpectedEndDate(defaultEndDate.toISOString().split('T')[0]);
      }
      
      fetchSkills();
    }
  }, [isOpen, session, currentUserId, fetchSkills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserSkill || !selectedOtherSkill || !userDescription || !otherDescription || !startDate || !expectedEndDate || !counterOfferMessage) {
      showAlert('warning', 'Please fill in all required fields including expected end date');
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(expectedEndDate);
    if (end <= start) {
      showAlert('warning', 'Expected end date must be after start date');
      return;
    }

    if (!session) return;

    // Check if the counter offer is identical to the original session
    const isUser1 = session.user1Id._id === currentUserId;
    
    // Extract original skill IDs
    let originalSkill1Id = '';
    let originalSkill2Id = '';
    
    if (session.skill1Id) {
      if (typeof session.skill1Id === 'string') {
        originalSkill1Id = session.skill1Id;
      } else if (session.skill1Id.id) {
        originalSkill1Id = session.skill1Id.id;
      } else if (session.skill1Id._id) {
        originalSkill1Id = session.skill1Id._id;
      } else if (session.skill1Id.toString) {
        originalSkill1Id = session.skill1Id.toString();
      }
    }
    
    if (session.skill2Id) {
      if (typeof session.skill2Id === 'string') {
        originalSkill2Id = session.skill2Id;
      } else if (session.skill2Id.id) {
        originalSkill2Id = session.skill2Id.id;
      } else if (session.skill2Id._id) {
        originalSkill2Id = session.skill2Id._id;
      } else if (session.skill2Id.toString) {
        originalSkill2Id = session.skill2Id.toString();
      }
    }

    // Compare current form data with original session data
    const currentSkill1Id = isUser1 ? selectedUserSkill : selectedOtherSkill;
    const currentSkill2Id = isUser1 ? selectedOtherSkill : selectedUserSkill;
    const currentDesc1 = isUser1 ? userDescription : otherDescription;
    const currentDesc2 = isUser1 ? otherDescription : userDescription;
    
    // Get original dates for comparison
    const originalStartDate = session.startDate.split('T')[0];
    const originalEndDate = session.expectedEndDate ? session.expectedEndDate.split('T')[0] : '';
    
    // Check if everything is identical
    const isIdenticalOffer = (
      currentSkill1Id === originalSkill1Id &&
      currentSkill2Id === originalSkill2Id &&
      currentDesc1.trim() === session.descriptionOfService1.trim() &&
      currentDesc2.trim() === session.descriptionOfService2.trim() &&
      startDate === originalStartDate &&
      expectedEndDate === originalEndDate
    );

    if (isIdenticalOffer) {
      showAlert('warning', 'You cannot submit the same offer as a counter offer. Please modify at least one aspect of the session (skills, descriptions, or dates).');
      return;
    }

    // Validate ObjectId format
    const isValidObjectId = (id: string) => {
      return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    };

    console.log('Validating skill IDs for counter offer:', { selectedUserSkill, selectedOtherSkill }); // Debug log

    if (!isValidObjectId(selectedUserSkill)) {
      console.error('Invalid user skill ID:', selectedUserSkill);
      showAlert('error', `Invalid user skill selection. ID format: ${selectedUserSkill}`);
      return;
    }
    
    if (!isValidObjectId(selectedOtherSkill)) {
      console.error('Invalid other skill ID:', selectedOtherSkill);
      showAlert('error', `Invalid other user skill selection. ID format: ${selectedOtherSkill}`);
      return;
    }

    setLoading(true);
    try {
      const isUser1 = session.user1Id._id === currentUserId;
      
      const counterOfferData = {
        originalSessionId: session._id,
        counterOfferedBy: currentUserId,
        skill1Id: isUser1 ? selectedUserSkill : selectedOtherSkill,
        skill2Id: isUser1 ? selectedOtherSkill : selectedUserSkill,
        descriptionOfService1: isUser1 ? userDescription : otherDescription,
        descriptionOfService2: isUser1 ? otherDescription : userDescription,
        startDate: new Date(startDate).toISOString(),
        expectedEndDate: new Date(expectedEndDate).toISOString(), // Always send expectedEndDate since it's now required
        counterOfferMessage,
      };

      console.log('Sending counter offer data:', counterOfferData); // Debug log

      const response = await fetch('/api/session/counter-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(counterOfferData),
      });

      const data = await response.json();
      
      if (data.success) {
        showAlert('success', 'Counter offer sent successfully!');
        onCounterOfferCreated();
        onClose();
      } else {
        console.error('Counter offer failed:', data); // Debug log
        showAlert('error', data.message || 'Failed to send counter offer');
      }
    } catch (error) {
      console.error('Error sending counter offer:', error);
      showAlert('error', 'Failed to send counter offer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedUserSkill('');
    setSelectedOtherSkill('');
    setUserDescription('');
    setOtherDescription('');
    setStartDate('');
    setExpectedEndDate('');
    setCounterOfferMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !session) return null;

  // Get the other user's name by combining firstName and lastName
  const getOtherUserName = () => {
    const otherUser = session.user1Id._id === currentUserId ? session.user2Id : session.user1Id;
    
    // Handle different data structures that might come from the API
    if (otherUser.firstName && otherUser.lastName) {
      return `${otherUser.firstName} ${otherUser.lastName}`;
    } else if (otherUser.name) {
      return otherUser.name;
    } else if (otherUser.firstName) {
      return otherUser.firstName;
    } else {
      return 'Unknown User';
    }
  };

  const otherUserName = getOtherUserName();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Counter Offer to {otherUserName}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {skillsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading skills...</p>
            </div>
          ) : (
            <>
              {/* Counter Offer Message */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-medium text-gray-900">Counter Offer Message</h3>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explain why you're making this counter offer:
                  </label>
                  <textarea
                    value={counterOfferMessage}
                    onChange={(e) => setCounterOfferMessage(e.target.value)}
                    placeholder="Explain what changes you're proposing and why..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Your Skill Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Your Skill (Modified)</h3>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select your skill to offer:
                  </label>
                  <select
                    value={selectedUserSkill}
                    onChange={(e) => setSelectedUserSkill(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a skill...</option>
                    {userSkills.map((skill) => (
                      <option key={skill.id || skill._id} value={skill.id || skill._id}>
                        {skill.skillTitle} ({skill.proficiencyLevel}) - {skill.categoryName}
                      </option>
                    ))}
                  </select>
                  
                  <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">
                    Describe what you'll provide:
                  </label>
                  <textarea
                    value={userDescription}
                    onChange={(e) => setUserDescription(e.target.value)}
                    placeholder="Describe what you'll teach or help with..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Other User's Skill Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {otherUserName}'s Skill (Modified)
                  </h3>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select skill you want from {otherUserName}:
                  </label>
                  <select
                    value={selectedOtherSkill}
                    onChange={(e) => setSelectedOtherSkill(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a skill...</option>
                    {otherUserSkills.map((skill) => (
                      <option key={skill.id || skill._id} value={skill.id || skill._id}>
                        {skill.skillTitle} ({skill.proficiencyLevel}) - {skill.categoryName}
                      </option>
                    ))}
                  </select>
                  
                  <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">
                    Describe what you want from {otherUserName}:
                  </label>
                  <textarea
                    value={otherDescription}
                    onChange={(e) => setOtherDescription(e.target.value)}
                    placeholder={`Describe what you want ${otherUserName} to teach or help with...`}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">Session Details (Modified)</h3>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed start date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                    Expected end date: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={expectedEndDate}
                    onChange={(e) => setExpectedEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    This helps both participants plan and track session progress (defaults to 1 month from start date)
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || skillsLoading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Counter Offer'}
            </button>
          </div>
        </form>
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
