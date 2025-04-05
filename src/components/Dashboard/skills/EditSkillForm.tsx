'use client';

import React, { useState, useEffect } from 'react';
import { updateUserSkill, getSkillCategories, getSkillsByCategory } from '@/lib/services/skillService';
import { useToast } from '@/lib/context/ToastContext';
import { UserSkill, UpdateSkillData, CategoryData } from '@/types/userSkill';

interface EditSkillFormProps {
  skill: UserSkill;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditSkillForm: React.FC<EditSkillFormProps> = ({ skill, onSuccess, onCancel }) => {
  const { showToast } = useToast();
  
  // Form state
  const [categoryId, setCategoryId] = useState<number>(skill.categoryId);
  const [categoryName, setCategoryName] = useState<string>(skill.categoryName);
  const [skillTitle, setSkillTitle] = useState<string>(skill.skillTitle);
  const [proficiencyLevel, setProficiencyLevel] = useState<string>(skill.proficiencyLevel);
  const [description, setDescription] = useState<string>(skill.description);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Data for dropdowns
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  
  // Form validation
  const [errors, setErrors] = useState({
    categoryId: '',
    skillTitle: '',
    proficiencyLevel: '',
    description: '',
  });

  // Load categories and skills on component mount
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
        
        // Fetch skills for the current category
        const skillsResponse = await getSkillsByCategory(skill.categoryId);
        if (skillsResponse.success && skillsResponse.data) {
          setAvailableSkills(skillsResponse.data);
        } else {
          showToast(skillsResponse.message || 'Failed to load skills', 'error');
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Error preparing the form', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [skill, showToast]);

  // Load skills when category changes
  useEffect(() => {
    const loadSkills = async () => {
      if (categoryId === 0) return;
      
      setLoading(true);
      try {
        const response = await getSkillsByCategory(categoryId);
        if (response.success && response.data) {
          setAvailableSkills(response.data);
          
          // If the current skill title is not in the new category, reset it
          if (!response.data.includes(skillTitle)) {
            setSkillTitle('');
          }
        } else {
          showToast(response.message || 'Failed to load skills', 'error');
        }
      } catch (error) {
        console.error('Error loading skills:', error);
        showToast('Error loading skills', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadSkills();
  }, [categoryId, showToast, skillTitle]);

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategoryId = parseInt(e.target.value);
    setCategoryId(selectedCategoryId);
    
    // Find selected category name
    const selectedCategory = categories.find(cat => cat.categoryId === selectedCategoryId);
    setCategoryName(selectedCategory ? selectedCategory.categoryName : '');
    
    // Clear error
    setErrors(prev => ({ ...prev, categoryId: '' }));
  };

  // Handle skill change
  const handleSkillChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSkillTitle(e.target.value);
    
    // Clear error
    setErrors(prev => ({ ...prev, skillTitle: '' }));
  };

  // Handle proficiency level change
  const handleProficiencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProficiencyLevel(e.target.value);
    
    // Clear error
    setErrors(prev => ({ ...prev, proficiencyLevel: '' }));
  };

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    
    // Clear error if description is valid
    if (e.target.value.length >= 10) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      categoryId: categoryId === 0 ? 'Please select a category' : '',
      skillTitle: !skillTitle ? 'Please select a skill' : '',
      proficiencyLevel: !proficiencyLevel ? 'Please select a proficiency level' : '',
      description: description.length < 10 ? 'Description must be at least 10 characters' : '',
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      // Ensure we have a valid string ID
      const skillId = skill.id;
      
      if (!skillId) {
        showToast('Invalid skill ID', 'error');
        return;
      }
      
      console.log('Submitting update for skill ID:', skillId, 'with data:', { 
        categoryId, 
        categoryName, 
        skillTitle, 
        proficiencyLevel, 
        description 
      });
      
      const updateData: UpdateSkillData = {
        categoryId,
        categoryName,
        skillTitle,
        proficiencyLevel,
        description,
      };

      const response = await updateUserSkill(skillId, updateData);
      console.log('Update response:', response);
      
      if (response.success) {
        showToast('Skill updated successfully', 'success');
        onSuccess();
      } else {
        showToast(response.message || 'Failed to update skill', 'error');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      showToast('Error updating skill', 'error');
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
      {/* Category Selection */}
      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Skill Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          className={`w-full p-3 border rounded-md ${errors.categoryId ? 'border-red-500' : 'border-gray-300'} 
                     focus:outline-none focus:ring-2 focus:ring-blue-500`}
          value={categoryId}
          onChange={handleCategoryChange}
          disabled={submitting}
        >
          <option value={0}>Select a Category</option>
          {categories.map(category => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
      </div>
      
      {/* Skill Title */}
      <div className="mb-4">
        <label htmlFor="skillTitle" className="block text-sm font-medium text-gray-700 mb-1">
          Skill Title <span className="text-red-500">*</span>
        </label>
        <select
          id="skillTitle"
          className={`w-full p-3 border rounded-md ${errors.skillTitle ? 'border-red-500' : 'border-gray-300'}
                     focus:outline-none focus:ring-2 focus:ring-blue-500`}
          value={skillTitle}
          onChange={handleSkillChange}
          disabled={submitting || categoryId === 0}
        >
          <option value="">Select a Skill</option>
          {availableSkills.map(skill => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
        {errors.skillTitle && <p className="mt-1 text-sm text-red-600">{errors.skillTitle}</p>}
      </div>

      {/* Proficiency Level */}
      <div className="mb-4">
        <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700 mb-1">
          Proficiency Level <span className="text-red-500">*</span>
        </label>
        <select
          id="proficiency"
          className={`w-full p-3 border rounded-md ${errors.proficiencyLevel ? 'border-red-500' : 'border-gray-300'}
                     focus:outline-none focus:ring-2 focus:ring-blue-500`}
          value={proficiencyLevel}
          onChange={handleProficiencyChange}
          disabled={submitting}
        >
          <option value="">Select Your Proficiency Level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Expert">Expert</option>
        </select>
        {errors.proficiencyLevel && <p className="mt-1 text-sm text-red-600">{errors.proficiencyLevel}</p>}
      </div>

      {/* Description */}
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          rows={4}
          className={`w-full p-3 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}
                     focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Describe your experience with this skill (minimum 10 characters)..."
          value={description}
          onChange={handleDescriptionChange}
          disabled={submitting}
          maxLength={500}
        ></textarea>
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description}</p>
          ) : (
            <p className="text-sm text-gray-500">Minimum 10 characters required</p>
          )}
          <p className="text-sm text-gray-500">{description.length}/500</p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50
                   focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
          disabled={submitting}
        >
          {submitting ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditSkillForm;