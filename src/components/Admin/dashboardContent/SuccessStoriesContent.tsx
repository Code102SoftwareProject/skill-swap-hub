"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Eye,
  EyeOff,
  BookOpen,
  Star,
  Calendar,
  User
} from "lucide-react";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface SuccessStory {
  _id: string;
  userId: User | null;
  title: string;
  description: string;
  image?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdBy: {
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateStoryFormData {
  userId: string;
  title: string;
  description: string;
  feedback: string;
  rating: number;
  isPublished: boolean;
}

export default function SuccessStoriesContent() {
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [formData, setFormData] = useState<CreateStoryFormData>({
    userId: "",
    title: "",
    description: "",
    feedback: "",
    rating: 5,
    isPublished: false,
  });

  // Fetch success stories
  const fetchSuccessStories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchTerm,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/success-stories?${params}`, {
        credentials: "include", // Important for cookies
      });
      const data = await response.json();

      console.log("Success stories response:", { status: response.status, data });

      if (response.ok && data.success) {
        // Filter out stories with null userId to prevent errors
        const validStories = data.data.successStories.filter((story: SuccessStory) => story.userId !== null);
        setSuccessStories(validStories);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        console.error("Failed to fetch success stories:", data);
        // If unauthorized, redirect to admin login
        if (response.status === 401) {
          console.warn("Admin not authenticated, redirecting to login");
          window.location.href = '/admin/login';
        }
      }
    } catch (error) {
      console.error("Error fetching success stories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: "include", // Important for cookies
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      } else {
        console.error("Failed to fetch users:", data.message);
        alert(`Failed to fetch users: ${data.message}`);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users. Please check your connection and try again.");
    }
  };

  useEffect(() => {
    fetchSuccessStories();
    fetchUsers();
  }, [currentPage, searchTerm, statusFilter]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingStory 
        ? "/api/admin/success-stories"
        : "/api/admin/success-stories";
      
      const method = editingStory ? "PUT" : "POST";
      const body = editingStory 
        ? { ...formData, id: editingStory._id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        setEditingStory(null);
        setFormData({
          userId: "",
          title: "",
          description: "",
          feedback: "",
          rating: 5,
          isPublished: false,
        });
        fetchSuccessStories();
      } else {
        alert(data.message || "Failed to save success story");
      }
    } catch (error) {
      console.error("Error saving success story:", error);
      alert("Failed to save success story");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this success story?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/success-stories?id=${id}`, {
        method: "DELETE",
        credentials: "include", // Important for cookies
      });

      const data = await response.json();

      if (data.success) {
        fetchSuccessStories();
      } else {
        alert(data.message || "Failed to delete success story");
      }
    } catch (error) {
      console.error("Error deleting success story:", error);
      alert("Failed to delete success story");
    }
  };

  // Handle toggle publish status
  const handleTogglePublish = async (story: SuccessStory) => {
    try {
      const response = await fetch("/api/admin/success-stories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies
        body: JSON.stringify({
          id: story._id,
          isPublished: !story.isPublished,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchSuccessStories();
      } else {
        alert(data.message || "Failed to update success story");
      }
    } catch (error) {
      console.error("Error updating success story:", error);
      alert("Failed to update success story");
    }
  };

  // Handle edit
  const handleEdit = (story: SuccessStory) => {
    setEditingStory(story);
    setFormData({
      userId: story.userId?._id || "",
      title: story.title,
      description: story.description,
      feedback: (story as any).feedback || "General feedback",
      rating: (story as any).rating || 5,
      isPublished: story.isPublished,
    });
    setShowCreateForm(true);
  };

  // Stats
  const totalStories = successStories.length;
  const publishedStories = successStories.filter(s => s.isPublished).length;
  const unpublishedStories = successStories.filter(s => !s.isPublished).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading success stories...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Success Stories Management</h1>
          <p className="text-gray-600 mt-1">Create and manage user success stories</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingStory(null);
            setFormData({
              userId: "",
              title: "",
              description: "",
              feedback: "",
              rating: 5,
              isPublished: false,
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Success Story
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Stories</p>
              <p className="text-2xl font-bold text-gray-900">{totalStories}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Eye className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{publishedStories}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <EyeOff className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unpublished</p>
              <p className="text-2xl font-bold text-gray-900">{unpublishedStories}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search stories..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="relative">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all" className="text-gray-900">All Stories</option>
                <option value="published" className="text-gray-900">Published</option>
                <option value="unpublished" className="text-gray-900">Unpublished</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {successStories.map((story) => (
              <tr key={story._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {story.userId?.avatar ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={story.userId.avatar}
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {story.userId ? `${story.userId.firstName} ${story.userId.lastName}` : "Unknown User"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {story.userId?.email || "No email"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium">
                    {story.title}
                  </div>
                  <div className="text-sm text-gray-600 truncate max-w-xs">
                    {story.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      story.isPublished
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {story.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                    {new Date(story.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTogglePublish(story)}
                      className={`${
                        story.isPublished
                          ? "text-yellow-600 hover:text-yellow-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                      title={story.isPublished ? "Unpublish" : "Publish"}
                    >
                      {story.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(story)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(story._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {successStories.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No success stories found</p>
            <p className="text-gray-500 text-sm mt-1">Create your first success story to get started</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStory ? "Edit Success Story" : "Add Success Story"}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User *
                </label>
                <div className="relative">
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <option value="" disabled className="text-gray-500">Select a user</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id} className="text-gray-900 py-2">
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={200}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 hover:border-gray-400 transition-colors"
                  placeholder="Enter story title"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  maxLength={1000}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 hover:border-gray-400 transition-colors resize-vertical"
                  placeholder="Enter story description"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback *
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 hover:border-gray-400 transition-colors resize-vertical"
                  placeholder="Enter user feedback"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.feedback.length}/500 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value={1}>1 Star</option>
                  <option value={2}>2 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={5}>5 Stars</option>
                </select>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                />
                <div className="ml-3">
                  <label htmlFor="isPublished" className="block text-sm font-medium text-gray-900">
                    Publish immediately
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Make this story visible on the homepage right away</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors font-medium min-w-[120px]"
                >
                  {editingStory ? "Update Story" : "Create Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
