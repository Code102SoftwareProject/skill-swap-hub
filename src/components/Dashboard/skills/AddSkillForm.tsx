'use client';

import React, { useState, useEffect } from 'react';
import { getSkillCategories, getSkillsByCategory, addUserSkill } from '@/services/skillService';
import { useToast } from '@/lib/context/ToastContext';

interface AddSkillFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Define interface for category data
interface CategoryData {
  categoryId: number;
  categoryName: string;
}

// Define interface for new skill data
interface NewSkillData {
  categoryId: number;
  categoryName: string;
  skillTitle: string;
  proficiencyLevel: string;
  description: string;
}

const AddSkillForm: React.FC<AddSkillFormProps> = ({ onSuccess, onCancel }) => {
  const { showToast } = useToast();
  
  // Form state
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form values
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categoryName, setCategoryName] = useState('');
  const [skillTitle, setSkillTitle] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState<string>('');
  const [description, setDescription] = useState('');
  
  // Form validation
  const [errors, setErrors] = useState({
    categoryId: '',
    skillTitle: '',
    proficiencyLevel: '',
    description: '',
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await getSkillCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        } else {
          showToast(response.message || 'Failed to load categories', 'error');
        }
      } catch (error) {
        showToast('Error loading categories', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [showToast]);

  // Fetch skills when category changes
  useEffect(() => {
    const fetchSkills = async () => {
      if (categoryId === '') return;
      
      setLoading(true);
      try {
        const response = await getSkillsByCategory(categoryId as number);
        if (response.success && response.data) {
          setSkills(response.data);
        } else {
          showToast(response.message || 'Failed to load skills', 'error');
        }
      } catch (error) {
        showToast('Error loading skills', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [categoryId, showToast]);

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      setCategoryId('');
      setCategoryName('');
    } else {
      const selectedCategoryId = parseInt(value);
      setCategoryId(selectedCategoryId);
      
      // Find selected category name
      const selectedCategory = categories.find(cat => cat.categoryId === selectedCategoryId);
      setCategoryName(selectedCategory ? selectedCategory.categoryName : '');
    }
    
    // Reset skill selection
    setSkillTitle('');
    
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
      categoryId: !categoryId ? 'Please select a category' : '',
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
      const skillData: NewSkillData = {
        categoryId: categoryId as number,
        categoryName,
        skillTitle,
        proficiencyLevel,
        description,
      };
      
      const response = await addUserSkill(skillData);
      
      if (response.success) {
        showToast('Skill added successfully', 'success');
        onSuccess();
      } else {
        showToast(response.message || 'Failed to add skill', 'error');
      }
    } catch (error) {
      showToast('Error adding skill', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
                    focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800`}
          value={categoryId === '' ? '' : categoryId.toString()}
          onChange={handleCategoryChange}
          disabled={loading || submitting}
        >
          <option value="" className="text-gray-800">Select a Category</option>
          {categories.map(category => (
            <option key={category.categoryId} value={category.categoryId} className="text-gray-800">
              {category.categoryName}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
      </div>

      {/* Skill Selection */}
      <div className="mb-4">
        <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-1">
          Skill Title <span className="text-red-500">*</span>
        </label>
        <select
          id="skill"
          className={`w-full p-3 border rounded-md ${errors.skillTitle ? 'border-red-500' : 'border-gray-300'} 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800`}
          value={skillTitle}
          onChange={handleSkillChange}
          disabled={loading || submitting || categoryId === ''}
        >
          <option value="" className="text-gray-800">Select a Skill</option>
          {skills.map(skill => (
            <option key={skill} value={skill} className="text-gray-800">
              {skill}
            </option>
          ))}
        </select>
        {errors.skillTitle && <p className="mt-1 text-sm text-red-600">{errors.skillTitle}</p>}
        {categoryId === '' && (
          <p className="mt-1 text-sm text-blue-600">Please select a category first</p>
        )}
      </div>

      {/* Proficiency Level */}
      <div className="mb-4">
        <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700 mb-1">
          Proficiency Level <span className="text-red-500">*</span>
        </label>
        <select
          id="proficiency"
          className={`w-full p-3 border rounded-md ${errors.proficiencyLevel ? 'border-red-500' : 'border-gray-300'} 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800`}
          value={proficiencyLevel}
          onChange={handleProficiencyChange}
          disabled={submitting}
        >
          <option value="" className="text-gray-800">Select Your Proficiency Level</option>
          <option value="Beginner" className="text-gray-800">Beginner - Basic knowledge and limited experience</option>
          <option value="Intermediate" className="text-gray-800">Intermediate - Good working knowledge and experience</option>
          <option value="Expert" className="text-gray-800">Expert - Advanced knowledge and extensive experience</option>
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
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800`}
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
            <p className="text-sm text-gray-600">Describe your experience, projects, and level of expertise (minimum 10 characters)</p>
          )}
          <p className="text-sm text-gray-600">{description.length}/500</p>
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
          {submitting ? 'Adding Skill...' : 'Add Skill'}
        </button>
      </div>
    </form>
  );
};

export default AddSkillForm;