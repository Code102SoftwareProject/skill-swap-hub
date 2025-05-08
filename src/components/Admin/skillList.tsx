'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // Import SweetAlert

// Define types to match the backend schema
interface ISkill {
  skillId: string;
  name: string;
}

interface ISkillList {
  _id: string;
  categoryId: number;
  categoryName: string;
  skills: ISkill[];
}

interface CategoryFormData {
  categoryName: string;
}

interface SkillFormData {
  skills: string;
}

const SkillLists = () => {
  // State
  const [skillLists, setSkillLists] = useState<ISkillList[]>([]);
  const [newCategory, setNewCategory] = useState<CategoryFormData>({ categoryName: '' });
  const [selectedCategory, setSelectedCategory] = useState<ISkillList | null>(null);
  const [newSkill, setNewSkill] = useState<SkillFormData>({ skills: '' });
  const [editingSkillList, setEditingSkillList] = useState<ISkillList | null>(null);
  const [updateForm, setUpdateForm] = useState<{ categoryName: string; skills: string }>({ categoryName: '', skills: '' });
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

  // Create a new category
  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await axios.post('/api/admin/skillLists', {
        categoryName: newCategory.categoryName,
        skills: [] // Start with empty skills array
      });

      setSkillLists([...skillLists, response.data]);
      setNewCategory({ categoryName: '' });
      setSuccess('Category created successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  // Check for duplicate skills in a category
  const hasDuplicateSkills = (categorySkills: ISkill[], newSkillNames: string[]): string[] => {
    const existingSkillNames = categorySkills.map(skill => skill.name.toLowerCase().trim());
    return newSkillNames.filter(name => 
      existingSkillNames.includes(name.toLowerCase().trim())
    );
  };

  // Add skills to a category
  const addSkillsToCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      // Parse the input skills
      const newSkillNames = newSkill.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      // Check for duplicates
      const duplicates = hasDuplicateSkills(selectedCategory.skills, newSkillNames);
      
      if (duplicates.length > 0) {
        // Show SweetAlert for duplicate skills
        Swal.fire({
          title: 'Duplicate Skills',
          text: `The following skills already exist: ${duplicates.join(', ')}`,
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }

      setLoading(true);
      // Convert skills to array of skill objects for those that aren't duplicates
      const skillsArray = newSkillNames.map(skillName => ({
        name: skillName
        // skillId will be generated on the server
      }));

      const response = await axios.put(`/api/admin/skillLists/${selectedCategory.categoryId}`, {
        categoryName: selectedCategory.categoryName,
        skills: skillsArray,
        appendSkills: true // Use our API feature to append skills instead of replacing
      });

      // Update the skill list in the state
      setSkillLists(skillLists.map(list => 
        list.categoryId === selectedCategory.categoryId ? response.data : list
      ));

      setNewSkill({ skills: '' });
      setSuccess('Skills added successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add skills');
    } finally {
      setLoading(false);
    }
  };

  // Select a category to add skills to
  const handleSelectCategory = (skillList: ISkillList) => {
    setSelectedCategory(skillList);
    setNewSkill({ skills: '' });
  };

  // Delete a skill list
  const deleteSkillList = async (categoryId: number) => {
    // Use SweetAlert for confirmation instead of window.confirm
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this skill category?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/admin/skillLists/${categoryId}`);
      setSkillLists(skillLists.filter(list => list.categoryId !== categoryId));
      
      // If the deleted category was selected, clear the selection
      if (selectedCategory && selectedCategory.categoryId === categoryId) {
        setSelectedCategory(null);
      }
      
      Swal.fire({
        title: 'Deleted!',
        text: 'Skill category has been deleted.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to delete skill category');
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete skill category.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove a skill from a category
  const removeSkill = async (categoryId: number, skillId: string) => {
    try {
      setLoading(true);
      
      // Find the category
      const category = skillLists.find(list => list.categoryId === categoryId);
      if (!category) return;
      
      // Filter out the skill to remove
      const updatedSkills = category.skills.filter(skill => skill.skillId !== skillId);
      
      const response = await axios.put(`/api/admin/skillLists/${categoryId}`, {
        categoryName: category.categoryName,
        skills: updatedSkills
      });

      // Update the skill list in the state
      setSkillLists(skillLists.map(list => 
        list.categoryId === categoryId ? response.data : list
      ));

      // If this category was selected, update the selected category too
      if (selectedCategory && selectedCategory.categoryId === categoryId) {
        setSelectedCategory(response.data);
      }
      
      setSuccess('Skill removed successfully');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove skill');
    } finally {
      setLoading(false);
    }
  };

  // Set up form for updating category name
  const setupUpdateForm = (skillList: ISkillList) => {
    setEditingSkillList(skillList);
    setUpdateForm({
      categoryName: skillList.categoryName,
      skills: skillList.skills.map(skill => skill.name).join(', ')
    });
  };

  // Update skill list category name
  const updateCategoryName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkillList) return;

    try {
      setLoading(true);

      const response = await axios.put(`/api/admin/skillLists/${editingSkillList.categoryId}`, {
        categoryName: updateForm.categoryName,
        skills: editingSkillList.skills // Keep the same skills
      });

      // Update the skill list in the state
      setSkillLists(skillLists.map(list => 
        list.categoryId === editingSkillList.categoryId ? response.data : list
      ));

      // If this category was selected, update the selected category too
      if (selectedCategory && selectedCategory.categoryId === editingSkillList.categoryId) {
        setSelectedCategory(response.data);
      }

      setEditingSkillList(null);
      
      Swal.fire({
        title: 'Updated!',
        text: 'Category name updated successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update category name');
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
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Skill Categories Manager</h1>

      {/* Status messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md mb-6 animate-pulse">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md mb-6 animate-pulse">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* Add new category form */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border-t-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl text-black font-semibold mb-4 flex items-center">
              <span className="mr-2">🏷️</span> Add New Category
            </h2>
            <form onSubmit={createCategory}>
              <div className="mb-4">
                <label htmlFor="categoryName" className="block text-gray-700 font-medium mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={newCategory.categoryName}
                  onChange={(e) => setNewCategory({categoryName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center"
                disabled={loading}
              >
                {loading ? 'Adding...' : '+ Add Category'}
              </button>
            </form>
          </div>

          {/* Add skills to category form */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border-t-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl text-black font-semibold mb-4 flex items-center">
              <span className="mr-2">🔧</span> Add Skills to Category
            </h2>
            {!selectedCategory ? (
              <p className="text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-200 italic">Select a category from the list to add skills</p>
            ) : (
              <>
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-medium text-lg">Selected Category: <span className="font-bold text-green-700">{selectedCategory.categoryName}</span></h3>
                </div>
                <form onSubmit={addSkillsToCategory}>
                  <div className="mb-4">
                    <label htmlFor="skills" className=" text-gray-700 font-medium mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Skills (comma-separated)
                    </label>
                    <textarea
                      id="skills"
                      value={newSkill.skills}
                      onChange={(e) => setNewSkill({skills: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 h-32"
                      placeholder="e.g. JavaScript, React, Node.js"
                      required
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center"
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : '+ Add Skills'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 border border-gray-300"
                    >
                      Cancel Selection
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div>
          {/* Edit category name form */}
          {editingSkillList && (
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border-t-4 border-blue-400 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl text-black font-semibold mb-4 flex items-center">
                <span className="mr-2">✏️</span> Edit Category Name
              </h2>
              <form onSubmit={updateCategoryName}>
                <div className="mb-4">
                  <label htmlFor="editCategoryName" className="block text-gray-700 font-medium mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="editCategoryName"
                    value={updateForm.categoryName}
                    onChange={(e) => setUpdateForm({...updateForm, categoryName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Name'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Display skill lists */}
          <div className="bg-white shadow-lg rounded-lg p-6 border-t-4 border-indigo-500 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl text-black font-semibold mb-6 flex items-center">
              <span className="mr-2">📋</span> Categories
            </h2>
            {loading && !skillLists.length ? (
              <div className="text-center py-10 animate-pulse">
                <div className="inline-block p-4 rounded-full bg-blue-50">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="mt-2 font-medium text-blue-600">Loading categories...</p>
              </div>
            ) : !skillLists.length ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-600">No categories found. Create one!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {skillLists.map((skillList) => (
                  <div key={skillList._id} className="border border-gray-100 rounded-lg bg-white overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 flex justify-between items-center border-b border-gray-100">
                      <h3 className="text-xl text-gray-800 font-semibold">{skillList.categoryName}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSelectCategory(skillList)}
                          className={`px-3 py-1 rounded-md ${
                            selectedCategory?.categoryId === skillList.categoryId 
                              ? 'bg-green-100 text-green-700 font-medium' 
                              : 'bg-white border border-green-200 text-green-600 hover:bg-green-50'
                          } transition-colors duration-150`}
                        >
                          {selectedCategory?.categoryId === skillList.categoryId ? 'Selected' : 'Select'}
                        </button>
                        <button
                          onClick={() => setupUpdateForm(skillList)}
                          className="px-3 py-1 rounded-md bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors duration-150"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSkillList(skillList.categoryId)}
                          className="px-3 py-1 rounded-md bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors duration-150"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      {skillList.skills.length > 0 ? (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                            </svg>
                            Skills:
                          </h4>
                          <ul className="flex flex-wrap gap-2">
                            {skillList.skills.map((skill) => (
                              <li 
                                key={skill.skillId} 
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm flex items-center shadow-sm transition-all duration-200 hover:shadow-md hover:from-blue-100 hover:to-indigo-100 border border-indigo-100 transform hover:-translate-y-0.5"
                              >
                                {skill.name}
                                <button 
                                  onClick={() => removeSkill(skillList.categoryId, skill.skillId)}
                                  className="ml-2 flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-700 transition-colors duration-150"
                                  title="Remove skill"
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No skills added yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillLists;