'use client';

import React, { useState, useEffect } from 'react';
import { getUserSkills, deleteUserSkill } from '@/lib/services/skillService';
import { UserSkill } from '@/types/userSkill';
import { useToast } from '@/lib/context/ToastContext';
import AddSkillForm from '@/components/Dashboard/skills/AddSkillForm';
import EditSkillForm from '@/components/Dashboard/skills/EditSkillForm';
import ConfirmationModal from '@/components/Dashboard/listings/ConfirmationModal';

const SkillsPage = () => {
  const { showToast } = useToast();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  
  // Delete confirmation state
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Fetch user skills on component mount
  useEffect(() => {
    fetchUserSkills();
  }, []);

  // Function to fetch user skills
  const fetchUserSkills = async () => {
    setLoading(true);
    try {
      const response = await getUserSkills();
      console.log('Fetched skills:', response);
      
      if (response.success && response.data) {
        setSkills(response.data as UserSkill[]);
      } else {
        showToast(response.message || 'Failed to load skills', 'error');
      }
    } catch (error) {
      console.error('Error in fetchUserSkills:', error);
      showToast('Error loading skills', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle skill deletion confirmation
  const confirmDeleteSkill = (skillId: string) => {
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
      console.log('Deleting skill with ID:', deletingSkillId);
      
      const response = await deleteUserSkill(deletingSkillId);
      console.log('Delete response:', response);
      
      if (response.success) {
        showToast('Skill deleted successfully', 'success');
        // Refresh the skills list
        fetchUserSkills();
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

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.categoryName]) {
      acc[skill.categoryName] = [];
    }
    acc[skill.categoryName].push(skill);
    return acc;
  }, {} as Record<string, UserSkill[]>);

  // Handle form submission success
  const handleFormSuccess = () => {
    fetchUserSkills();
    setShowAddForm(false);
    setEditingSkill(null);
  };

  // Render skill card
  const renderSkillCard = (skill: UserSkill) => {
    console.log('Rendering skill card:', skill);
    
    return (
      <div 
        key={skill.id} 
        className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold text-blue-800">{skill.skillTitle}</h3>
            <div className="flex items-center">
              <span className={`px-2 py-1 text-xs rounded-full ${
                skill.proficiencyLevel === 'Expert' ? 'bg-blue-100 text-blue-800' :
                skill.proficiencyLevel === 'Intermediate' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {skill.proficiencyLevel}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-blue-600 mb-3">
            {skill.categoryName}
          </div>
          
          <p className="text-gray-700 mb-4">
            {skill.description}
          </p>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                console.log('Edit button clicked for skill:', skill.id);
                setEditingSkill(skill);
              }}
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                console.log('Delete button clicked for skill:', skill.id);
                confirmDeleteSkill(skill.id);
              }}
              className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Skills</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Add My Skills
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <div className="space-y-8">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorySkills.map(skill => renderSkillCard(skill))}
              </div>
            </div>
          ))}
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
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
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
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
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