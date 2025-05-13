'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { 
  updateListing, 
} from '@/services/listingService';
import { 
  getSkillCategories, 
  getSkillsByCategory, 
  getUserSkills 
} from '@/services/skillService';
import { SkillListing, UpdateListingData } from '@/types/skillListing';
import { UserSkill } from '@/types/userSkill';

interface EditListingFormProps {
  listing: SkillListing;
  onSuccess: () => void;
  onCancel: () => void;
}

// Category type
interface CategoryData {
  categoryId: number;
  categoryName: string;
}

const EditListingForm: React.FC<EditListingFormProps> = ({ listing, onSuccess, onCancel }) => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data for dropdowns
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [offeringSkills, setOfferingSkills] = useState<string[]>([]);
  const [seekingSkills, setSeekingSkills] = useState<string[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  
  // Form state - Offering
  const [selectedUserSkill, setSelectedUserSkill] = useState<string>('');
  const [offeringData, setOfferingData] = useState({
    skillId: listing.offering.skillId || '',
    categoryId: listing.offering.categoryId,
    categoryName: listing.offering.categoryName,
    skillTitle: listing.offering.skillTitle,
    proficiencyLevel: listing.offering.proficiencyLevel,
    description: listing.offering.description
  });
  
  // Form state - Seeking
  const [seekingCategoryId, setSeekingCategoryId] = useState<number>(listing.seeking.categoryId);
  const [seekingCategoryName, setSeekingCategoryName] = useState(listing.seeking.categoryName);
  const [seekingSkillTitle, setSeekingSkillTitle] = useState(listing.seeking.skillTitle);
  
  // Form state - Additional Info
  const [description, setDescription] = useState(listing.additionalInfo.description || '');
  const [availability, setAvailability] = useState(listing.additionalInfo.availability || '');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'active' | 'matched' | 'completed' | 'cancelled'>(listing.status);
  
  // Form validation errors
  const [errors, setErrors] = useState({
    offering: {
      skill: '',
      userSkill: ''
    },
    seeking: {
      category: '',
      skill: ''
    },
    additionalInfo: {
      description: ''
    }
  });

  // Initialize form with listing data
  useEffect(() => {
    // Initialize tags
    if (listing.additionalInfo.tags) {
      if (Array.isArray(listing.additionalInfo.tags)) {
        setTags(listing.additionalInfo.tags.join(', '));
      } else {
        setTags(listing.additionalInfo.tags);
      }
    }
    
    // Load categories, user skills, and other data
    loadInitialData();
  }, [listing]);

  // Load initial data for dropdowns
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesResponse = await getSkillCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      } else {
        showToast(categoriesResponse.message || 'Failed to load categories', 'error');
      }
      
      // Fetch user skills
      const userSkillsResponse = await getUserSkills();
      if (userSkillsResponse.success && userSkillsResponse.data) {
        setUserSkills(userSkillsResponse.data);
        
        // If the listing has a skillId, select it
        if (listing.offering.skillId) {
          setSelectedUserSkill(listing.offering.skillId);
        }
      } else {
        showToast(userSkillsResponse.message || 'Failed to load your skills', 'error');
      }
      
      // Load skills for the offering category
      if (listing.offering.categoryId) {
        const offeringSkillsResponse = await getSkillsByCategory(listing.offering.categoryId);
        if (offeringSkillsResponse.success && offeringSkillsResponse.data) {
          setOfferingSkills(offeringSkillsResponse.data);
        }
      }
      
      // Load skills for the seeking category
      if (listing.seeking.categoryId) {
        const seekingSkillsResponse = await getSkillsByCategory(listing.seeking.categoryId);
        if (seekingSkillsResponse.success && seekingSkillsResponse.data) {
          setSeekingSkills(seekingSkillsResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('Error preparing the form', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load skills when seeking category changes
  useEffect(() => {
    const loadSkillsForSeekingCategory = async () => {
      if (seekingCategoryId === 0) return;
      
      setLoading(true);
      try {
        const response = await getSkillsByCategory(seekingCategoryId);
        if (response.success && response.data) {
          setSeekingSkills(response.data);
        } else {
          showToast(response.message || 'Failed to load skills', 'error');
        }
      } catch (error) {
        console.error('Error loading skills for category:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSkillsForSeekingCategory();
  }, [seekingCategoryId, showToast]);

// Update to the handleUserSkillChange function in EditListingForm.tsx

// Handle user skill selection
const handleUserSkillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const skillId = e.target.value;
  setSelectedUserSkill(skillId);
  
  if (skillId) {
    const skill = userSkills.find(s => s.id === skillId);
    if (skill) {
      setOfferingData({
        skillId: skill.id,  // Make sure to store the skillId explicitly
        categoryId: skill.categoryId,
        categoryName: skill.categoryName,
        skillTitle: skill.skillTitle,
        proficiencyLevel: skill.proficiencyLevel,
        description: skill.description
      });
    }
  } else {
    // Keep current data if no skill is selected
    setOfferingData({
      ...offeringData,
      skillId: ''
    });
  }
  
  // Clear errors
  setErrors(prev => ({
    ...prev,
    offering: {
      ...prev.offering,
      userSkill: ''
    }
  }));
};
  // Handle seeking category change
  const handleSeekingCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = parseInt(e.target.value);
    setSeekingCategoryId(categoryId);
    
    // Find the category name
    const category = categories.find(c => c.categoryId === categoryId);
    setSeekingCategoryName(category ? category.categoryName : '');
    
    // Reset skill selection
    setSeekingSkillTitle('');
    
    // Clear errors
    setErrors(prev => ({
      ...prev,
      seeking: {
        ...prev.seeking,
        category: ''
      }
    }));
  };

  // Handle seeking skill change
  const handleSeekingSkillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSeekingSkillTitle(e.target.value);
    
    // Clear errors
    setErrors(prev => ({
      ...prev,
      seeking: {
        ...prev.seeking,
        skill: ''
      }
    }));
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    
    // Validate
    if (value.length < 10) {
      setErrors(prev => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          description: 'Description must be at least 10 characters'
        }
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          description: ''
        }
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      offering: {
        skill: '',
        userSkill: ''
      },
      seeking: {
        category: '',
        skill: ''
      },
      additionalInfo: {
        description: ''
      }
    };
    
    // Validate offering
    if (!offeringData.skillTitle) {
      newErrors.offering.skill = 'Please select a skill to offer';
    }
    
    // Validate seeking
    if (seekingCategoryId === 0) {
      newErrors.seeking.category = 'Please select a category';
    }
    
    if (!seekingSkillTitle) {
      newErrors.seeking.skill = 'Please select a skill you want to learn';
    }
    
    // Validate additional info
    if (description.length < 10) {
      newErrors.additionalInfo.description = 'Description must be at least 10 characters';
    }
    
    setErrors(newErrors);
    
    // Check if there are any errors
    return !Object.values(newErrors).some(group => 
      Object.values(group).some(error => error)
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Process tags
      let processedTags: string | string[] = tags;
      if (tags) {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }
      
      // Prepare update data
      const updateData: UpdateListingData = {
        offering: {
          skillId: offeringData.skillId,
          categoryId: offeringData.categoryId,
          categoryName: offeringData.categoryName,
          skillTitle: offeringData.skillTitle,
          proficiencyLevel: offeringData.proficiencyLevel,
          description: offeringData.description
        },
        seeking: {
          categoryId: seekingCategoryId,
          categoryName: seekingCategoryName,
          skillTitle: seekingSkillTitle
        },
        additionalInfo: {
          description,
          availability: availability || undefined,
          tags: processedTags || undefined
        },
        status
      };
      
      const response = await updateListing(listing.id, updateData);
      
      if (response.success) {
        showToast('Listing updated successfully', 'success');
        onSuccess();
      } else {
        showToast(response.message || 'Failed to update listing', 'error');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      showToast('Error updating listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offering Section */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Skill I'm Offering</h3>
          
          {/* User Skills Dropdown */}
          <div className="mb-4">
            <label htmlFor="userSkill" className="block text-sm font-medium text-gray-700 mb-1">
              Your skills
            </label>
            <select
              id="userSkill"
              className={`w-full p-3 border rounded-md ${errors.offering.userSkill ? 'border-red-500' : 'border-gray-300'} 
                      bg-white text-gray-800 appearance-none`}
              value={selectedUserSkill}
              onChange={handleUserSkillChange}
              disabled={submitting || userSkills.length === 0}
            >
              <option value="" className="text-gray-800">Select from your skills (optional)</option>
              {userSkills.map(skill => (
                <option key={skill.id} value={skill.id} className="text-gray-800">
                  {skill.skillTitle} ({skill.proficiencyLevel})
                </option>
              ))}
            </select>
            {errors.offering.userSkill && (
              <p className="mt-1 text-sm text-red-600">{errors.offering.userSkill}</p>
            )}
            
            {userSkills.length === 0 && (
              <p className="mt-2 text-sm text-gray-600">
                You haven't added any skills to your profile yet.
              </p>
            )}
          </div>
          
          {/* If not using a user skill, allow manual input */}
          {!selectedUserSkill && (
            <>
              <div className="mb-4">
                <label htmlFor="offeringTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Title
                </label>
                <input
                  id="offeringTitle"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800"
                  value={offeringData.skillTitle}
                  onChange={(e) => setOfferingData({...offeringData, skillTitle: e.target.value})}
                  placeholder="Enter the skill you're offering"
                  disabled={submitting || !!selectedUserSkill}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="offeringProficiency" className="block text-sm font-medium text-gray-700 mb-1">
                  Proficiency Level
                </label>
                <select
                  id="offeringProficiency"
                  className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800 appearance-none"
                  value={offeringData.proficiencyLevel}
                  onChange={(e) => setOfferingData({...offeringData, proficiencyLevel: e.target.value as any})}
                  disabled={submitting || !!selectedUserSkill}
                >
                  <option value="Beginner" className="text-gray-800">Beginner</option>
                  <option value="Intermediate" className="text-gray-800">Intermediate</option>
                  <option value="Expert" className="text-gray-800">Expert</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="offeringDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Description
                </label>
                <textarea
                  id="offeringDescription"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800"
                  value={offeringData.description}
                  onChange={(e) => setOfferingData({...offeringData, description: e.target.value})}
                  placeholder="Describe your experience with this skill"
                  disabled={submitting || !!selectedUserSkill}
                />
              </div>
            </>
          )}
          
          {/* Selected Skill Preview */}
          {selectedUserSkill && (
            <div className="mt-4 p-4 bg-white rounded-md border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2">{offeringData.skillTitle}</h4>
              <p className="text-sm text-gray-600 mb-2">Category: {offeringData.categoryName}</p>
              <p className="text-sm text-gray-600 mb-2">Level: {offeringData.proficiencyLevel}</p>
              <p className="text-sm text-gray-700">{offeringData.description}</p>
            </div>
          )}
        </div>
        
        {/* Seeking Section */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Skill I'm Seeking</h3>
          
          {/* Category Selection */}
          <div className="mb-4">
            <label htmlFor="seekingCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="seekingCategory"
              className={`w-full p-3 border rounded-md ${errors.seeking.category ? 'border-red-500' : 'border-gray-300'} 
                      bg-white text-gray-800 appearance-none`}
              value={seekingCategoryId}
              onChange={handleSeekingCategoryChange}
              disabled={submitting}
            >
              <option value={0} className="text-gray-800">Select a Category</option>
              {categories.map(category => (
                <option key={category.categoryId} value={category.categoryId} className="text-gray-800">
                  {category.categoryName}
                </option>
              ))}
            </select>
            {errors.seeking.category && (
              <p className="mt-1 text-sm text-red-600">{errors.seeking.category}</p>
            )}
          </div>
          
          {/* Skill Selection */}
          <div className="mb-4">
            <label htmlFor="seekingSkill" className="block text-sm font-medium text-gray-700 mb-1">
              Skill Title
            </label>
            <select
              id="seekingSkill"
              className={`w-full p-3 border rounded-md ${errors.seeking.skill ? 'border-red-500' : 'border-gray-300'} 
                      bg-white text-gray-800 appearance-none`}
              value={seekingSkillTitle}
              onChange={handleSeekingSkillChange}
              disabled={submitting || seekingCategoryId === 0}
            >
              <option value="" className="text-gray-800">Select a Title</option>
              {seekingSkills.map(skill => (
                <option key={skill} value={skill} className="text-gray-800">
                  {skill}
                </option>
              ))}
            </select>
            {errors.seeking.skill && (
              <p className="mt-1 text-sm text-red-600">{errors.seeking.skill}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional Information */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
        
        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className={`w-full p-3 border rounded-md ${errors.additionalInfo.description ? 'border-red-500' : 'border-gray-300'} 
                     bg-white text-gray-800`}
            placeholder="Describe your experience and what you are looking to exchange"
            value={description}
            onChange={handleDescriptionChange}
            disabled={submitting}
            maxLength={500}
          ></textarea>
          <div className="flex justify-between mt-1">
            {errors.additionalInfo.description ? (
              <p className="text-sm text-red-600">{errors.additionalInfo.description}</p>
            ) : (
              <p className="text-sm text-gray-600">Description must be at least 10 characters</p>
            )}
            <p className="text-sm text-gray-600">{description.length}/500</p>
          </div>
        </div>
        
        {/* Availability */}
        <div className="mb-4">
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
            Availability (Optional)
          </label>
          <input
            id="availability"
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800"
            placeholder="e.g., Weekdays after 6pm, Weekends"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            disabled={submitting}
          />
        </div>
        
        {/* Tags */}
        <div className="mb-4">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (Optional)
          </label>
          <input
            id="tags"
            type="text"
            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800"
            placeholder="Enter tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={submitting}
          />
          <p className="text-sm text-gray-600 mt-1">Separate tags with commas (e.g., online, flexible, beginner-friendly)</p>
        </div>
        
        {/* Status */}
        <div className="mb-4">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Listing Status
          </label>
          <select
            id="status"
            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-800 appearance-none"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'matched' | 'completed' | 'cancelled')}
            disabled={submitting}
          >
            <option value="active" className="text-gray-800">Active</option>
            <option value="matched" className="text-gray-800">Matched</option>
            <option value="completed" className="text-gray-800">Completed</option>
            <option value="cancelled" className="text-gray-800">Cancelled</option>
          </select>
        </div>
      </div>
      
      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-400"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditListingForm;