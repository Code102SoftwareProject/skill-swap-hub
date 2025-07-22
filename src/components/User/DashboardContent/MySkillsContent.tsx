// File: src/components/User/DashboardContent/MySkillsContent.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSkills, deleteUserSkill } from '@/services/skillService';
import { getSkillsUsedInMatches } from '@/services/trendingService';
import { UserSkill } from '@/types/userSkill';
import { useToast } from '@/lib/context/ToastContext';
import AddSkillForm from '@/components/Dashboard/skills/AddSkillForm';
import EditSkillForm from '@/components/Dashboard/skills/EditSkillForm';
import ConfirmationModal from '@/components/Dashboard/listings/ConfirmationModal';
import { Info, AlertTriangle, Users, Calendar, Search, Filter, BarChart3, Award, Target, Activity, BookOpen, Settings, TrendingUp, Layers, Eye, Edit2, Trash2, Lock, ChevronDown, BadgeCheck, AlertCircle, Clock, ExternalLink } from 'lucide-react';

interface MySkillsContentProps {
  onNavigateToSkillVerification?: () => void;
}

const SkillsPage = ({ onNavigateToSkillVerification }: MySkillsContentProps = {}) => {
  const { showToast } = useToast();
  const router = useRouter(); // Fallback for standalone usage
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [viewingSkill, setViewingSkill] = useState<UserSkill | null>(null);
  
  // Delete confirmation state
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Skills used in listings and matches
  const [usedSkillIds, setUsedSkillIds] = useState<string[]>([]);
  const [matchUsedSkills, setMatchUsedSkills] = useState<any>(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProficiency, setSelectedProficiency] = useState<string>('all');
  const [selectedUsageStatus, setSelectedUsageStatus] = useState<string>('all');
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Custom dropdown states for mobile
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProficiencyDropdown, setShowProficiencyDropdown] = useState(false);
  const [showUsageDropdown, setShowUsageDropdown] = useState(false);
  const [showVerificationDropdown, setShowVerificationDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Function to fetch user skills and used skill IDs
  const fetchUserData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Fetch skills
      const skillsResponse = await getUserSkills();
      
      // Fetch skills used in listings (existing functionality)
      const usedSkillsResponse = await fetch('/api/myskills/used-in-listings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const usedSkillsData = await usedSkillsResponse.json();
      
      // Fetch skills used in matches (new functionality)
      const matchUsedResponse = await getSkillsUsedInMatches();
      
      if (skillsResponse.success && skillsResponse.data) {
        setSkills(skillsResponse.data as UserSkill[]);
      } else {
        showToast(skillsResponse.message || 'Failed to load skills', 'error');
      }
      
      if (usedSkillsData.success && usedSkillsData.data) {
        setUsedSkillIds(usedSkillsData.data as string[]);
      }
      
      if (matchUsedResponse.success && matchUsedResponse.data) {
        setMatchUsedSkills(matchUsedResponse.data);
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      showToast('Error loading skills', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch user skills and used skill IDs on component mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Check if a skill is used in a listing
  const isSkillUsedInListing = React.useCallback((skillId: string) => {
    return usedSkillIds.includes(skillId);
  }, [usedSkillIds]);

  // Check if a skill is used in active matches
  const isSkillUsedInMatches = React.useCallback((skillId: string) => {
    return matchUsedSkills?.usedSkillIds?.includes(skillId) || false;
  }, [matchUsedSkills]);

  // Get match details for a skill
  const getSkillMatchDetails = (skillTitle: string) => {
    if (!matchUsedSkills?.matchDetails) return [];
    return matchUsedSkills.matchDetails.filter((match: any) => 
      match.usedSkills.includes(skillTitle)
    );
  };

  // Check if skill can be modified (not in listings or matches)
  const canModifySkill = (skillId: string) => {
    return !isSkillUsedInListing(skillId) && !isSkillUsedInMatches(skillId);
  };

  // Handle skill deletion confirmation
  const confirmDeleteSkill = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;

    // Check if skill can be deleted
    if (isSkillUsedInListing(skillId)) {
      showToast('This skill cannot be deleted because it is used in a listing', 'error');
      return;
    }

    if (isSkillUsedInMatches(skillId)) {
      const matchDetails = getSkillMatchDetails(skill.skillTitle);
      const matchTypes = matchDetails.map((m: any) => m.matchType).join(', ');
      showToast(`This skill cannot be deleted because it is used in active skill matches (${matchTypes})`, 'error');
      return;
    }
    
    setDeletingSkillId(skillId);
    setShowDeleteConfirmation(true);
  };

  // Handle skill deletion
  const handleDeleteSkill = async () => {
    if (!deletingSkillId) {
      setShowDeleteConfirmation(false);
      return;
    }
    
    try {
      const response = await deleteUserSkill(deletingSkillId);
      
      if (response.success) {
        showToast('Skill deleted successfully', 'success');
        // Refresh the skills list
        fetchUserData();
      } else {
        showToast(response.message || 'Failed to delete skill', 'error');
      }
    } catch (error) {
      console.error('Error in handleDeleteSkill:', error);
      showToast('Error deleting skill', 'error');
    } finally {
      // Reset deletion state
      setDeletingSkillId(null);
      setShowDeleteConfirmation(false);
    }
  };

  // Calculate overall statistics
  const skillStats = useMemo(() => {
    const totalSkills = skills.length;
    const expertSkills = skills.filter(s => s.proficiencyLevel === 'Expert').length;
    const intermediateSkills = skills.filter(s => s.proficiencyLevel === 'Intermediate').length;
    const beginnerSkills = skills.filter(s => s.proficiencyLevel === 'Beginner').length;
    const usedInListings = skills.filter(s => isSkillUsedInListing(s.id)).length;
    const usedInMatches = skills.filter(s => isSkillUsedInMatches(s.id)).length;
    const categories = [...new Set(skills.map(s => s.categoryName))].length;
    const verifiedSkills = skills.filter(s => s.isVerified).length;
    const unverifiedSkills = skills.filter(s => !s.isVerified).length;
    
    return {
      total: totalSkills,
      expert: expertSkills,
      intermediate: intermediateSkills,
      beginner: beginnerSkills,
      usedInListings,
      usedInMatches,
      categories,
      verified: verifiedSkills,
      unverified: unverifiedSkills
    };
  }, [skills, isSkillUsedInListing, isSkillUsedInMatches]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    return [...new Set(skills.map(skill => skill.categoryName))];
  }, [skills]);

  // Filter and sort skills
  const filteredAndSortedSkills = useMemo(() => {
    let filtered = skills.filter(skill => {
      // Search filter
      if (searchTerm && !skill.skillTitle.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all' && skill.categoryName !== selectedCategory) {
        return false;
      }
      
      // Proficiency filter
      if (selectedProficiency !== 'all' && skill.proficiencyLevel !== selectedProficiency) {
        return false;
      }
      
      // Usage status filter
      if (selectedUsageStatus !== 'all') {
        const usedInListing = isSkillUsedInListing(skill.id);
        const usedInMatch = isSkillUsedInMatches(skill.id);
        
        if (selectedUsageStatus === 'used' && !usedInListing && !usedInMatch) return false;
        if (selectedUsageStatus === 'unused' && (usedInListing || usedInMatch)) return false;
        if (selectedUsageStatus === 'listings' && !usedInListing) return false;
        if (selectedUsageStatus === 'matches' && !usedInMatch) return false;
      }
      
      // Verification status filter
      if (selectedVerificationStatus !== 'all') {
        if (selectedVerificationStatus === 'verified' && !skill.isVerified) return false;
        if (selectedVerificationStatus === 'unverified' && skill.isVerified) return false;
      }
      
      return true;
    });

    // Sort skills
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.skillTitle.localeCompare(b.skillTitle);
        case 'category':
          return a.categoryName.localeCompare(b.categoryName);
        case 'proficiency':
          const proficiencyOrder = { 'Expert': 3, 'Intermediate': 2, 'Beginner': 1 };
          return proficiencyOrder[b.proficiencyLevel] - proficiencyOrder[a.proficiencyLevel];
        case 'usage':
          const aUsage = (isSkillUsedInListing(a.id) ? 2 : 0) + (isSkillUsedInMatches(a.id) ? 1 : 0);
          const bUsage = (isSkillUsedInListing(b.id) ? 2 : 0) + (isSkillUsedInMatches(b.id) ? 1 : 0);
          return bUsage - aUsage;
        default:
          return 0;
      }
    });

    return filtered;
  }, [skills, searchTerm, selectedCategory, selectedProficiency, selectedUsageStatus, selectedVerificationStatus, sortBy, isSkillUsedInListing, isSkillUsedInMatches]);

  // Group filtered skills by category
  const skillsByCategory = filteredAndSortedSkills.reduce((acc, skill) => {
    if (!acc[skill.categoryName]) {
      acc[skill.categoryName] = [];
    }
    acc[skill.categoryName].push(skill);
    return acc;
  }, {} as Record<string, UserSkill[]>);

  // Handle form submission success
  const handleFormSuccess = () => {
    fetchUserData();
    setShowAddForm(false);
    setEditingSkill(null);
  };

  // Attempt to edit a skill
  const attemptToEditSkill = (skill: UserSkill) => {
    // Check if skill can be edited
    if (isSkillUsedInListing(skill.id)) {
      showToast('This skill cannot be edited because it is used in a listing', 'error');
      return;
    }

    if (isSkillUsedInMatches(skill.id)) {
      const matchDetails = getSkillMatchDetails(skill.skillTitle);
      const matchTypes = matchDetails.map((m: any) => m.matchType).join(', ');
      showToast(`This skill cannot be edited because it is used in active skill matches (${matchTypes})`, 'error');
      return;
    }
    
    setEditingSkill(skill);
  };

  // View skill details
  const viewSkillDetails = (skill: UserSkill) => {
    setViewingSkill(skill);
  };

  // Navigate to skill verification page
  const navigateToSkillVerification = () => {
    if (onNavigateToSkillVerification) {
      // Use dashboard navigation if available
      onNavigateToSkillVerification();
    } else {
      // Fallback to router navigation for standalone usage
      router.push('/user/skillverification');
    }
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Get skill status indicators
  const getSkillStatusIndicators = (skill: UserSkill) => {
    const indicators = [];
    
    if (isSkillUsedInListing(skill.id)) {
      indicators.push({
        type: 'listing',
        color: 'blue',
        text: 'Used in listing'
      });
    }
    
    if (isSkillUsedInMatches(skill.id)) {
      const matchDetails = getSkillMatchDetails(skill.skillTitle);
      indicators.push({
        type: 'match',
        color: 'purple',
        text: `Used in ${matchDetails.length} active match${matchDetails.length > 1 ? 'es' : ''}`
      });
    }
    
    return indicators;
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowCategoryDropdown(false);
    setShowProficiencyDropdown(false);
    setShowUsageDropdown(false);
    setShowVerificationDropdown(false);
    setShowSortDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-dropdown')) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Truncate category names for mobile
  const truncateCategory = (category: string, maxLength: number = 20) => {
    if (category.length <= maxLength) return category;
    return category.slice(0, maxLength) + '...';
  };

  // Custom dropdown component for mobile
  const CustomDropdown = ({ 
    value, 
    options, 
    onChange, 
    placeholder, 
    isOpen, 
    setIsOpen, 
    renderValue,
    className = ""
  }: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    placeholder: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    renderValue?: (value: string) => string;
    className?: string;
  }) => (
    <div className={`custom-dropdown relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          closeAllDropdowns();
          setIsOpen(!isOpen);
        }}
        className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 text-left flex items-center justify-between"
      >
        <span className="truncate">
          {renderValue ? renderValue(value) : (options.find(opt => opt.value === value)?.label || placeholder)}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-50 ${
                value === option.value ? 'bg-blue-100 text-blue-800' : 'text-gray-900'
              }`}
            >
              <span className="block truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Render skill card - matching your screenshot exactly
  const renderSkillCard = (skill: UserSkill) => {
    const isUsedInListing = isSkillUsedInListing(skill.id);
    const isUsedInMatch = isSkillUsedInMatches(skill.id);
    const canModify = canModifySkill(skill.id);
    const statusIndicators = getSkillStatusIndicators(skill);
    
    return (
      <div 
        key={skill.id} 
        className={`bg-white rounded-lg shadow-sm w-full h-[170px] relative ${
          isUsedInListing ? 'border-l-4 border-l-blue-500' : 
          isUsedInMatch ? 'border-l-4 border-l-purple-500' : 
          'border border-gray-100'
        }`}
      >
        <div className="px-5 py-5 h-full flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            {/* Title row with proficiency level always inline */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center flex-1 min-w-0 gap-2">
                <h3 className="text-lg font-semibold text-blue-700 truncate">
                  {skill.skillTitle}
                </h3>
                {skill.isVerified ? (
                  <BadgeCheck className="w-5 h-5 text-green-500 flex-shrink-0" aria-label="Verified Skill" />
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" aria-label="Skill Not Verified" />
                    <button
                      onClick={navigateToSkillVerification}
                      className="w-4 h-4 text-blue-500 hover:text-blue-700 flex-shrink-0"
                      title="Request Skill Verification"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                skill.proficiencyLevel === 'Expert' ? 'bg-blue-100 text-blue-800' :
                skill.proficiencyLevel === 'Intermediate' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {skill.proficiencyLevel}
              </span>
            </div>
            
            {/* Status indicators row */}
            {statusIndicators.length > 0 && (
              <div className="flex items-center gap-2">
                {statusIndicators.map((indicator, index) => (
                  <div 
                    key={index}
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      indicator.color === 'blue' ? 'bg-blue-500' :
                      indicator.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                    }`}
                    title={indicator.text}
                  >
                    {indicator.type === 'listing' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                    {indicator.type === 'match' && (
                      <Users className="w-3 h-3 text-white" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Status text */}
          {statusIndicators.length > 0 && (
            <div className="text-xs text-gray-600 mb-2">
              {statusIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center gap-1">
                  {indicator.type === 'match' && <Users className="w-3 h-3" />}
                  {indicator.type === 'listing' && <Calendar className="w-3 h-3" />}
                  {indicator.text}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => viewSkillDetails(skill)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <Eye className="w-4 h-4 mr-1" /> View Details
            </button>
            
            {canModify ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => attemptToEditSkill(skill)}
                  className="w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => confirmDeleteSkill(skill.id)}
                  className="w-8 h-8 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center text-xs text-gray-500">
                <Lock className="w-4 h-4 mr-1" />
                Protected
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Category options for dropdown
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(category => ({ 
      value: category, 
      label: truncateCategory(category) 
    }))
  ];

  // Proficiency options
  const proficiencyOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'Expert', label: 'Expert' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Beginner', label: 'Beginner' }
  ];

  // Usage status options
  const usageOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'used', label: 'Used' },
    { value: 'unused', label: 'Unused' },
    { value: 'listings', label: 'In Listings' },
    { value: 'matches', label: 'In Matches' }
  ];

  // Verification status options
  const verificationOptions = [
    { value: 'all', label: 'All Verification' },
    { value: 'verified', label: 'Verified' },
    { value: 'unverified', label: 'Unverified' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Sort by Name' },
    { value: 'category', label: 'Sort by Category' },
    { value: 'proficiency', label: 'Sort by Level' },
    { value: 'usage', label: 'Sort by Usage' }
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My Skills</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Add My Skills
        </button>
      </div>

      {/* Overall Statistics */}
      {skills.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2 mb-3">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-md p-2 text-center">
                <div className="flex justify-center mb-1">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-800">{skillStats.total}</div>
                <div className="text-xs text-blue-600">Total Skills</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-md p-2 text-center">
                <div className="flex justify-center mb-1">
                  <Award className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-800">{skillStats.expert}</div>
                <div className="text-xs text-blue-600">Expert</div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-md p-2 text-center">
                <div className="flex justify-center mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-lg font-bold text-green-800">{skillStats.intermediate}</div>
                <div className="text-xs text-green-600">Intermediate</div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-md p-2 text-center">
                <div className="flex justify-center mb-1">
                  <Settings className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="text-lg font-bold text-yellow-800">{skillStats.beginner}</div>
                <div className="text-xs text-yellow-600">Beginner</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-md p-2 text-center relative">
                <div className="flex justify-center mb-1">
                  {/* Match indicator - same as skill cards */}
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-800">{skillStats.usedInMatches}</div>
                <div className="text-xs text-purple-600">In Matches</div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-md p-2 text-center relative">
                <div className="flex justify-center mb-1">
                  {/* Listing indicator - same as skill cards */}
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="text-lg font-bold text-indigo-800">{skillStats.usedInListings}</div>
                <div className="text-xs text-indigo-600">In Listings</div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-md p-2 text-center">
                <div className="flex justify-center mb-1">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-emerald-800">{skillStats.verified}</div>
                <div className="text-xs text-emerald-600">Verified</div>
              </div>
              
              <button 
                onClick={navigateToSkillVerification}
                className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-md p-2 text-center hover:from-orange-100 hover:to-orange-200 transition-colors cursor-pointer"
                title="Go to Skill Verification"
              >
                <div className="flex justify-center mb-1">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-lg font-bold text-orange-800">{skillStats.unverified}</div>
                <div className="text-xs text-orange-600 flex items-center justify-center gap-1">
                  Unverified
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-md p-2 text-center">
                <div className="flex justify-center mb-1">
                  <Layers className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-lg font-bold text-gray-800">{skillStats.categories}</div>
                <div className="text-xs text-gray-600">Categories</div>
              </div>
            </div>
          )}

      {/* Search and Filters */}
      {skills.length > 0 && (
        <div className="bg-white rounded-md shadow-sm border p-3 mb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Search - Full width on mobile */}
            <div className="relative col-span-2 sm:col-span-3 lg:col-span-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded text-gray-900 placeholder-gray-500 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Use custom dropdowns for mobile responsiveness */}
            <div className="block sm:hidden">
              <CustomDropdown
                value={selectedCategory}
                options={categoryOptions}
                onChange={setSelectedCategory}
                placeholder="All Categories"
                isOpen={showCategoryDropdown}
                setIsOpen={setShowCategoryDropdown}
                renderValue={(value) => value === 'all' ? 'All Categories' : truncateCategory(value, 15)}
              />
            </div>

            <div className="block sm:hidden">
              <CustomDropdown
                value={selectedProficiency}
                options={proficiencyOptions}
                onChange={setSelectedProficiency}
                placeholder="All Levels"
                isOpen={showProficiencyDropdown}
                setIsOpen={setShowProficiencyDropdown}
              />
            </div>

            <div className="hidden sm:block">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block">
              <select
                value={selectedProficiency}
                onChange={(e) => setSelectedProficiency(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">All Levels</option>
                <option value="Expert">Expert</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Beginner">Beginner</option>
              </select>
            </div>

            <div className="hidden lg:block">
              <select
                value={selectedUsageStatus}
                onChange={(e) => setSelectedUsageStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">All Status</option>
                <option value="used">Used</option>
                <option value="unused">Unused</option>
                <option value="listings">In Listings</option>
                <option value="matches">In Matches</option>
              </select>
            </div>

            <div className="hidden lg:block">
              <select
                value={selectedVerificationStatus}
                onChange={(e) => setSelectedVerificationStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>

            <div className="hidden lg:block">
              <CustomDropdown
                value={sortBy}
                options={sortOptions}
                onChange={setSortBy}
                placeholder="Sort by Name"
                isOpen={showSortDropdown}
                setIsOpen={setShowSortDropdown}
                className="lg:hidden"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8 hidden lg:block"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="name">Sort by Name</option>
                <option value="category">Sort by Category</option>
                <option value="proficiency">Sort by Level</option>
                <option value="usage">Sort by Usage</option>
              </select>
            </div>
          </div>

          {/* Mobile-only additional filters row */}
          <div className="grid grid-cols-2 gap-2 mt-2 sm:hidden">
            <CustomDropdown
              value={selectedUsageStatus}
              options={usageOptions}
              onChange={setSelectedUsageStatus}
              placeholder="All Status"
              isOpen={showUsageDropdown}
              setIsOpen={setShowUsageDropdown}
            />
            <CustomDropdown
              value={selectedVerificationStatus}
              options={verificationOptions}
              onChange={setSelectedVerificationStatus}
              placeholder="All Verification"
              isOpen={showVerificationDropdown}
              setIsOpen={setShowVerificationDropdown}
            />
          </div>
          
          {/* Mobile sort filter row */}
          <div className="grid grid-cols-1 gap-2 mt-2 sm:hidden">
            <CustomDropdown
              value={sortBy}
              options={sortOptions}
              onChange={setSortBy}
              placeholder="Sort by Name"
              isOpen={showSortDropdown}
              setIsOpen={setShowSortDropdown}
            />
          </div>
        </div>
      )}

      {/* Compact Info Row */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
        <div>
          {skills.length > 0 && (
            <span>Showing {filteredAndSortedSkills.length} of {skills.length} skills</span>
          )}
        </div>
        <div>
          {matchUsedSkills?.totalActiveMatches > 0 && (
            <div className="flex items-center bg-purple-50 border border-purple-200 rounded px-2 py-1">
              <Users className="w-3 h-3 text-purple-600 mr-1" />
              <span className="text-purple-700">
                {matchUsedSkills.totalActiveMatches} active match{matchUsedSkills.totalActiveMatches > 1 ? 'es' : ''} - Skills protected
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredAndSortedSkills.length === 0 && skills.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No skills match your filters</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedProficiency('all');
              setSelectedUsageStatus('all');
              setSelectedVerificationStatus('all');
              closeAllDropdowns();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      ) : skills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-2">You haven't added any skills yet</h3>
          <p className="text-gray-500 mb-4">Add skills to showcase your expertise and find matching users</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Your First Skill
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 pb-2 border-b">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySkills.map(skill => renderSkillCard(skill))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Skill Details Modal */}
      {viewingSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Skill Details</h2>
                <button 
                  onClick={() => setViewingSkill(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="border-b pb-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-blue-700">{viewingSkill.skillTitle}</h3>
                    {viewingSkill.isVerified ? (
                      <BadgeCheck className="w-6 h-6 text-green-500" aria-label="Verified Skill" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-orange-400" aria-label="Skill Not Verified" />
                    )}
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                    viewingSkill.proficiencyLevel === 'Expert' ? 'bg-blue-100 text-blue-800' :
                    viewingSkill.proficiencyLevel === 'Intermediate' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {viewingSkill.proficiencyLevel}
                  </span>
                </div>
                <div className="text-sm text-blue-600 mb-1">
                  {viewingSkill.categoryName}
                </div>
                
                {/* Verification status */}
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    viewingSkill.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {viewingSkill.isVerified ? (
                      <>
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        Skill Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Verification Needed
                      </>
                    )}
                  </div>
                  {!viewingSkill.isVerified && (
                    <button
                      onClick={navigateToSkillVerification}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
                      title="Request Verification"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Request Verification
                    </button>
                  )}
                </div>
                
                {/* Status indicators */}
                {(isSkillUsedInListing(viewingSkill.id) || isSkillUsedInMatches(viewingSkill.id)) && (
                  <div className="mt-2 space-y-1">
                    {isSkillUsedInListing(viewingSkill.id) && (
                      <div className="flex items-center text-sm text-blue-700">
                        <span className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </span>
                        This skill is being used in an active listing
                      </div>
                    )}
                    
                    {isSkillUsedInMatches(viewingSkill.id) && (
                      <div className="flex items-center text-sm text-purple-700">
                        <Users className="w-4 h-4 text-purple-500 mr-2" />
                        This skill is involved in active skill matches
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600 whitespace-pre-line">{viewingSkill.description}</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  onClick={() => setViewingSkill(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                
                {canModifySkill(viewingSkill.id) && (
                  <button
                    onClick={() => {
                      setViewingSkill(null);
                      attemptToEditSkill(viewingSkill);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    Edit Skill
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Add My Skills</h2>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <AddSkillForm 
                onSuccess={handleFormSuccess} 
                onCancel={() => setShowAddForm(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Skill Form Modal */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Edit Skill</h2>
                <button 
                  onClick={() => setEditingSkill(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <EditSkillForm 
                skill={editingSkill} 
                onSuccess={handleFormSuccess} 
                onCancel={() => setEditingSkill(null)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Skill"
        message="Are you sure you want to delete this skill? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteSkill}
        onCancel={() => {
          setDeletingSkillId(null);
          setShowDeleteConfirmation(false);
        }}
      />
    </div>
  );
};

export default SkillsPage;