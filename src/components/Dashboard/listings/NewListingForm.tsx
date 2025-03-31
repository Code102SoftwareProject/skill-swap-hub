'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { 
  getSkillCategories, 
  getSkillsByCategory, 
  getUserSkills 
} from '@/lib/services/skillService';
import { createListing } from '@/lib/services/listingService';
import { UserSkill } from '@/types/userSkill';
import { NewListingData } from '@/types/skillListing';

interface NewListingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Category type
interface CategoryData {
  categoryId: number;
  categoryName: string;
}

const NewListingForm: React.FC<NewListingFormProps> = ({ onSuccess, onCancel }) => {
  const { showToast } = useToast();
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Data states
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  
  // Form values for offering
  const [selectedUserSkill, setSelectedUserSkill] = useState<string>('');
  const [offeringData, setOfferingData] = useState({
    skillId: '',
    categoryId: -1,
    categoryName: '',
    skillTitle: '',
    proficiencyLevel: '',
    description: ''
  });
  
  // Form values for seeking
  const [seekingCategoryId, setSeekingCategoryId] = useState<number | ''>('');
  const [seekingCategoryName, setSeekingCategoryName] = useState('');
  const [seekingSkillTitle, setSeekingSkillTitle] = useState('');
  
  // Form values for additional info
  const [description, setDescription] = useState('');
  const [availability, setAvailability] = useState('');
  const [tags, setTags] = useState('');
  
  // Form validation
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

  // Load categories and user skills on component mount
  useEffect(() => {
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
        } else {
          showToast(userSkillsResponse.message || 'Failed to load your skills', 'error');
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Error preparing the form', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [showToast]);

  // Load skills when seeking category changes
  useEffect(() => {
    const loadSkillsForCategory = async () => {
      if (seekingCategoryId === '') return;
      
      setLoading(true);
      try {
        const response = await getSkillsByCategory(seekingCategoryId as number);
        if (response.success && response.data) {
          setSkills(response.data);
        } else {
          showToast(response.message || 'Failed to load skills', 'error');
        }
      } catch (error) {
        console.error('Error loading skills for category:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSkillsForCategory();
  }, [seekingCategoryId, showToast]);

  // Handle user skill selection
  const handleUserSkillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const skillId = e.target.value;
    setSelectedUserSkill(skillId);
    
    if (skillId) {
      const skill = userSkills.find(s => s.id === skillId);
      if (skill) {
        setOfferingData({
          skillId: skill.id,
          categoryId: skill.categoryId,
          categoryName: skill.categoryName,
          skillTitle: skill.skillTitle,
          proficiencyLevel: skill.proficiencyLevel,
          description: skill.description
        });
      }
    } else {
      setOfferingData({
        skillId: '',
        categoryId: -1,
        categoryName: '',
        skillTitle: '',
        proficiencyLevel: '',
        description: ''
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
    const categoryId = e.target.value;
    
    if (categoryId === '') {
      setSeekingCategoryId('');
      setSeekingCategoryName('');
    } else {
      const catId = parseInt(categoryId);
      setSeekingCategoryId(catId);
      
      // Find the category name
      const category = categories.find(c => c.categoryId === catId);
      setSeekingCategoryName(category ? category.categoryName : '');
    }
    
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
    setDescription(e.target.value);
    
    // Clear error if valid
    if (e.target.value.length >= 10) {
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
    if (!selectedUserSkill) {
      newErrors.offering.userSkill = 'Please select a skill you want to offer';
    }
    
    // Validate seeking
    if (seekingCategoryId === '') {
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
      // Prepare the listing data
      const listingData: NewListingData = {
        offering: {
          skillId: offeringData.skillId,
          categoryId: offeringData.categoryId,
          categoryName: offeringData.categoryName,
          skillTitle: offeringData.skillTitle,
          proficiencyLevel: offeringData.proficiencyLevel as 'Beginner' | 'Intermediate' | 'Expert',
          description: offeringData.description
        },
        seeking: {
          categoryId: seekingCategoryId as number,
          categoryName: seekingCategoryName,
          skillTitle: seekingSkillTitle
        },
        additionalInfo: {
          description: description,
          availability: availability || undefined,
          tags: tags || undefined
        }
      };
      
      const response = await createListing(listingData);
      
      if (response.success) {
        showToast('Listing created successfully', 'success');
        onSuccess();
      } else {
        showToast(response.message || 'Failed to create listing', 'error');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      showToast('Error creating listing', 'error');
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
        {/* Left Column - Offering */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Skill I'm Offering</h3>
          
          {/* User Skills Dropdown */}
          <div className="mb-4">
            <label htmlFor="userSkill" className="block text-sm font-medium text-gray-700 mb-1">
              Your skills
            </label>
            <select
              id="userSkill"
              className={`w-full p-3 border rounded-md ${errors.offering.userSkill ? 'border-red-500' : 'border-gray-300'}`}
              value={selectedUserSkill}
              onChange={handleUserSkillChange}
              disabled={submitting || userSkills.length === 0}
            >
              <option value="">Select your skill</option>
              {userSkills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.skillTitle} ({skill.proficiencyLevel})
                </option>
              ))}
            </select>
            {errors.offering.userSkill && (
              <p className="mt-1 text-sm text-red-600">{errors.offering.userSkill}</p>
            )}
            
            {userSkills.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                You need to add skills to your profile first.
                <a href="/dashboard/skills" className="ml-1 text-blue-600 hover:underline">
                  Add skills now
                </a>
              </p>
            )}
          </div>
          
          {/* Selected Skill Preview */}
          {selectedUserSkill && (
            <div className="mt-4 p-4 bg-white rounded-md">
              <h4 className="font-medium text-gray-800 mb-2">{offeringData.skillTitle}</h4>
              <p className="text-sm text-gray-600 mb-2">Category: {offeringData.categoryName}</p>
              <p className="text-sm text-gray-600 mb-2">Level: {offeringData.proficiencyLevel}</p>
              <p className="text-sm text-gray-700">{offeringData.description}</p>
            </div>
          )}
        </div>
        
        {/* Right Column - Seeking */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">Skill I'm Seeking</h3>
          
          {/* Category Selection */}
          <div className="mb-4">
            <label htmlFor="seekingCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="seekingCategory"
              className={`w-full p-3 border rounded-md ${errors.seeking.category ? 'border-red-500' : 'border-gray-300'}`}
              value={seekingCategoryId === '' ? '' : seekingCategoryId.toString()}
              onChange={handleSeekingCategoryChange}
              disabled={submitting}
            >
              <option value="">Select a Category</option>
              {categories.map(category => (
                <option key={category.categoryId} value={category.categoryId}>
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
              className={`w-full p-3 border rounded-md ${errors.seeking.skill ? 'border-red-500' : 'border-gray-300'}`}
              value={seekingSkillTitle}
              onChange={handleSeekingSkillChange}
              disabled={submitting || seekingCategoryId === ''}
            >
              <option value="">Select a Title</option>
              {skills.map(skill => (
                <option key={skill} value={skill}>
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
            className={`w-full p-3 border rounded-md ${errors.additionalInfo.description ? 'border-red-500' : 'border-gray-300'}`}
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
              <p className="text-sm text-gray-500">Description must be at least 10 characters</p>
            )}
            <p className="text-sm text-gray-500">{description.length}/500</p>
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
            className="w-full p-3 border border-gray-300 rounded-md"
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
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Enter tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={submitting}
          />
          <p className="text-sm text-gray-500 mt-1">Separate tags with commas (e.g., online, flexible, beginner-friendly)</p>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
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
          disabled={submitting || userSkills.length === 0}
        >
          {submitting ? 'Creating...' : 'Create Listing'}
        </button>
      </div>
    </form>
  );
};

export default NewListingForm;