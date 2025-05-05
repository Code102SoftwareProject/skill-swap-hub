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
      <h1 className="text-3xl text-black font-bold mb-6">Skill Categories Manager</h1>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* Add new category form */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl text-black font-semibold mb-4">Add New Category</h2>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>

          {/* Add skills to category form */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl text-black font-semibold mb-4">Add Skills to Category</h2>
            {!selectedCategory ? (
              <p className="text-gray-600">Select a category from the list on the right to add skills</p>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="font-medium text-lg">Selected Category: <span className="font-bold">{selectedCategory.categoryName}</span></h3>
                </div>
                <form onSubmit={addSkillsToCategory}>
                  <div className="mb-4">
                    <label htmlFor="skills" className="block text-gray-700 font-medium mb-2">
                      Skills (comma-separated)
                    </label>
                    <textarea
                      id="skills"
                      value={newSkill.skills}
                      onChange={(e) => setNewSkill({skills: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Skills'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="ml-2 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
                  >
                    Cancel Selection
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <div>
          {/* Edit category name form */}
          {editingSkillList && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-2xl text-black font-semibold mb-4">Edit Category Name</h2>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Name'}
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
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl text-black font-semibold mb-4">Categories</h2>
            {loading && !skillLists.length ? (
              <div className="text-center py-10">Loading categories...</div>
            ) : !skillLists.length ? (
              <div className="text-center py-10">No categories found. Create one!</div>
            ) : (
              skillLists.map((skillList) => (
                <div key={skillList._id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-xl text-black font-semibold">{skillList.categoryName}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectCategory(skillList)}
                        className={`${selectedCategory?.categoryId === skillList.categoryId ? 'text-green-700' : 'text-green-500 hover:text-green-700'}`}
                      >
                        {selectedCategory?.categoryId === skillList.categoryId ? 'Selected' : 'Select'}
                      </button>
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
                  {skillList.skills.length > 0 ? (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Skills:</h4>
                      <ul className="flex flex-wrap gap-2">
                        {skillList.skills.map((skill) => (
                          <li 
                            key={skill.skillId} 
                            className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            {skill.name}
                            <button 
                              onClick={() => removeSkill(skillList.categoryId, skill.skillId)}
                              className="ml-2 text-red-500 hover:text-red-700 font-bold"
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillLists;