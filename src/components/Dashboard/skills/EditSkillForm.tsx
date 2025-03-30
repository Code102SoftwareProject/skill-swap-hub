// File: src/components/Dashboard/skills/EditSkillForm.tsx
'use client';

import React, { useState } from 'react';
import { updateUserSkill } from '@/lib/services/skillService';
import { useToast } from '@/lib/context/ToastContext';
import { UserSkill, UpdateSkillData } from '@/types/userSkill';

interface EditSkillFormProps {
  skill: UserSkill;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditSkillForm: React.FC<EditSkillFormProps> = ({ skill, onSuccess, onCancel }) => {
  const { showToast } = useToast();
  
  // Form state
  const [proficiencyLevel, setProficiencyLevel] = useState<string>(skill.proficiencyLevel);
  const [description, setDescription] = useState<string>(skill.description);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Form validation
  const [errors, setErrors] = useState({
    proficiencyLevel: '',
    description: '',
  });

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
      
      console.log('Submitting update for skill ID:', skillId, 'with data:', { proficiencyLevel, description });
      
      const updateData: UpdateSkillData = {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Skill Title and Category (read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Skill Title
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
          value={skill.skillTitle}
          disabled
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
          value={skill.categoryName}
          disabled
        />
      </div>

      {/* Debug info - hidden in production */}
      <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
        Skill ID: {skill.id}
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
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditSkillForm;