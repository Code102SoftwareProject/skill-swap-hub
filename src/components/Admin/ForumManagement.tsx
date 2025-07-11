'use client';

import { useState, useEffect } from 'react';
import { IForum } from '@/lib/models/Forum';
import Swal from 'sweetalert2';

interface ForumFormData {
  title: string;
  description: string;
  image: string;
}

export default function ForumManagement() {
  const [forums, setForums] = useState<IForum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ForumFormData>({
    title: '',
    description: '',
    image: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch all forums
  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forums');
      if (!response.ok) {
        throw new Error('Failed to fetch forums');
      }
      const data = await response.json();
      setForums(data.forums || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes 
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form data when opening/closing modal
  useEffect(() => {
    if (!showCreateModal) {
      setFormData({ title: '', description: '', image: '' });
      setError(null);
    }
  }, [showCreateModal]);

  // Handle forum creation
  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/forums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          lastActive: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create forum');
      }

      const newForum = await response.json();
      setForums((prev) => [...prev, newForum]);
      setShowCreateModal(false);
      
      Swal.fire({
        title: 'Success!',
        text: 'Forum created successfully!',
        icon: 'success',
        confirmButtonColor: '#3085d6',
      });
      
      fetchForums(); // Refresh the forum list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      Swal.fire({
        title: 'Error!',
        text: err instanceof Error ? err.message : 'An error occurred',
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle forum deletion
  const handleDeleteForum = async (forumId: string, forumTitle: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the forum "${forumTitle}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/forums/${forumId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete forum');
          }

          setForums((prev) => prev.filter((forum) => forum._id !== forumId));
          
          Swal.fire(
            'Deleted!',
            'The forum has been deleted successfully.',
            'success'
          );
        } catch (err) {
          Swal.fire(
            'Error!',
            err instanceof Error ? err.message : 'An error occurred',
            'error'
          );
        }
      }
    });
  };

  if (loading) {
    return <div className="p-4 text-center">Loading forums...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl text-black font-bold mb-6">Forum Management</h1>
      
      {/* Create Forum Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create New Forum
        </button>
      </div>
      
      {/* Forums List */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl text-black font-semibold mb-4">All Forums</h2>
        {forums.length === 0 ? (
          <p className="text-gray-500">No forums found.</p>
        ) : (
          <div className="overflow-x-auto text-black">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Title</th>
                  <th className="py-2 px-4 border-b text-left">Description</th>
                  <th className="py-2 px-4 border-b text-left">Posts</th>
                  <th className="py-2 px-4 border-b text-left">Last Active</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {forums.map((forum) => (
                  <tr key={forum._id}>
                    <td className="py-2 px-4 border-b">{forum.title}</td>
                    <td className="py-2 px-4 border-b truncate max-w-xs">{forum.description}</td>
                    <td className="py-2 px-4 border-b">{forum.posts}</td>
                    <td className="py-2 px-4 border-b">{new Date(forum.lastActive).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleDeleteForum(forum._id, forum.title)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Create Forum Modal  */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
             onClick={(e) => {
               // Close modal only if clicking the backdrop, not the modal content
               if (e.target === e.currentTarget) {
                 setShowCreateModal(false);
               }
             }}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-black font-semibold">Create New Forum</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleCreateForum}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                  Image URL
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="image"
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Forum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}