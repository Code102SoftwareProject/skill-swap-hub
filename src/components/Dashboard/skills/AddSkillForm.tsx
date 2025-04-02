// File: src/components/Dashboard/skills/AddSkillForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getSkillCategories, getSkillsByCategory, addUserSkill } from '@/lib/services/skillService';
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
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="category"
          className={`w-full p-3 border rounded-md ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}`}
          value={categoryId === '' ? '' : categoryId.toString()}
          onChange={handleCategoryChange}
          disabled={loading || submitting}
        >
          <option value="">Select a Category</option>
          {categories.map(category => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
      </div>

      {/* Skill Selection */}
      <div>
        <label htmlFor="skill" className="block text-sm font-medium text-gray-700 mb-1">
          Skill Title
        </label>
        <select
          id="skill"
          className={`w-full p-3 border rounded-md ${errors.skillTitle ? 'border-red-500' : 'border-gray-300'}`}
          value={skillTitle}
          onChange={handleSkillChange}
          disabled={loading || submitting || categoryId === ''}
        >
          <option value="">Select a Title</option>
          {skills.map(skill => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
        {errors.skillTitle && <p className="mt-1 text-sm text-red-600">{errors.skillTitle}</p>}
      </div>

      {/* Proficiency Level */}
      <div>
        <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700 mb-1">
          Proficiency Level
        </label>
        <select
          id="proficiency"
          className={`w-full p-3 border rounded-md ${errors.proficiencyLevel ? 'border-red-500' : 'border-gray-300'}`}
          value={proficiencyLevel}
          onChange={handleProficiencyChange}
          disabled={submitting}
        >
          <option value="">Select level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Expert">Expert</option>
        </select>
        {errors.proficiencyLevel && <p className="mt-1 text-sm text-red-600">{errors.proficiencyLevel}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className={`w-full p-3 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Describe your expertise with this skill..."
          value={description}
          onChange={handleDescriptionChange}
          disabled={submitting}
          maxLength={500}
        ></textarea>
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description}</p>
          ) : (
            <p className="text-sm text-gray-500">Description must be at least 10 characters</p>
          )}
          <p className="text-sm text-gray-500">{description.length}/500</p>
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
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
};

export default AddSkillForm;