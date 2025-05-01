'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

// Define types
interface ISkillList {
  _id: string;
  categoryId: number;
  categoryName: string;
  skills: string[];
}

interface FormData {
  categoryName: string;
  skills: string;
}

const SkillLists = () => {
  // State
  const [skillLists, setSkillLists] = useState<ISkillList[]>([]);
  const [newSkillList, setNewSkillList] = useState<FormData>({ categoryName: '', skills: '' });
  const [editingSkillList, setEditingSkillList] = useState<ISkillList | null>(null);
  const [updateForm, setUpdateForm] = useState<FormData>({ categoryName: '', skills: '' });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch skill lists on component mount
  useEffect(() => {
    fetchSkillLists();
  }, []);

  // Fetch all skill lists
  const fetchSkillLists = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/skillLists');
      setSkillLists(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch skill lists');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new skill list
  const createSkillList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Convert comma-separated skills to array
      const skillsArray = newSkillList.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const response = await axios.post('/api/admin/skillLists', {
        categoryName: newSkillList.categoryName,
        skills: skillsArray
      });

      setSkillLists([...skillLists, response.data]);
      setNewSkillList({ categoryName: '', skills: '' });
      setSuccess('Skill list created successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create skill list');
    } finally {
      setLoading(false);
    }
  };

  // Delete a skill list
  const deleteSkillList = async (categoryId: number) => {
    if (!window.confirm('Are you sure you want to delete this skill list?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/admin/skillLists/${categoryId}`);
      setSkillLists(skillLists.filter(list => list.categoryId !== categoryId));
      setSuccess('Skill list deleted successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete skill list');
    } finally {
      setLoading(false);
    }
  };

  // Set up form for updating
  const setupUpdateForm = (skillList: ISkillList) => {
    setEditingSkillList(skillList);
    setUpdateForm({
      categoryName: skillList.categoryName,
      skills: skillList.skills.join(', ')
    });
  };

  // Update skill list
  const updateSkillList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkillList) return;

    try {
      setLoading(true);
      // Convert comma-separated skills to array
      const skillsArray = updateForm.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const response = await axios.put(`/api/admin/skillLists/${editingSkillList.categoryId}`, {
        categoryName: updateForm.categoryName,
        skills: skillsArray
      });

      // Update the skill list in the state
      setSkillLists(skillLists.map(list => 
        list.categoryId === editingSkillList.categoryId ? response.data : list
      ));

      setEditingSkillList(null);
      setSuccess('Skill list updated successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update skill list');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSkillList(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl text-black font-bold mb-6">Skill Lists Manager</h1>

      {/* Status messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Add new skill list form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl text-black font-semibold mb-4">Add New Skill Category</h2>
        <form onSubmit={createSkillList}>
          <div className="mb-4">
            <label htmlFor="categoryName" className="block text-gray-700 font-medium mb-2">
              Category Name
            </label>
            <input
              type="text"
              id="categoryName"
              value={newSkillList.categoryName}
              onChange={(e) => setNewSkillList({...newSkillList, categoryName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="skills" className="block text-gray-700 font-medium mb-2">
              Skills (comma-separated)
            </label>
            <textarea
              id="skills"
              value={newSkillList.skills}
              onChange={(e) => setNewSkillList({...newSkillList, skills: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Skill Category'}
          </button>
        </form>
      </div>

      {/* Edit skill list form */}
      {editingSkillList && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl text-black font-semibold mb-4">Edit Skill Category</h2>
          <form onSubmit={updateSkillList}>
            <div className="mb-4">
              <label htmlFor="editCategoryName" className="block text-gray-700 font-medium mb-2">
                Category Name
              </label>
              <input
                type="text"
                id="editCategoryName"
                value={updateForm.categoryName}
                onChange={(e) => setUpdateForm({...updateForm, categoryName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="editSkills" className="block text-gray-700 font-medium mb-2">
                Skills (comma-separated)
              </label>
              <textarea
                id="editSkills"
                value={updateForm.skills}
                onChange={(e) => setUpdateForm({...updateForm, skills: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Skill Category'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Display skill lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !skillLists.length ? (
          <div className="col-span-full text-center py-10">Loading skill lists...</div>
        ) : !skillLists.length ? (
          <div className="col-span-full text-center py-10">No skill lists found. Create one!</div>
        ) : (
          skillLists.map((skillList) => (
            <div key={skillList._id} className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between mb-4">
                <h3 className="text-xl text-black font-semibold">{skillList.categoryName}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setupUpdateForm(skillList)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSkillList(skillList.categoryId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {skillList.skills.map((skill, index) => (
                  <li key={index} className="text-gray-700">{skill}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SkillLists;