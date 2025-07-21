"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
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
  User,
  X
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
  feedback: string;
  rating: number;
  image?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdBy?: {
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  displayName: string;
  isAnonymous: boolean;
  canSuccessStoryPost: boolean;
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
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  }, []);

  // Handle keyboard shortcuts
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  }, [clearSearch]);

  // Memoize search params to prevent unnecessary re-renders
  const searchParams = useMemo(() => ({
    page: currentPage.toString(),
    limit: "10",
    search: debouncedSearchTerm,
    status: statusFilter,
  }), [currentPage, debouncedSearchTerm, statusFilter]);

  // Fetch success stories
  const fetchSuccessStories = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const params = new URLSearchParams(searchParams);

      const response = await fetch(`/api/admin/success-stories?${params}`, {
        credentials: "include", // Important for cookies
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      
      // Check if response is HTML (likely an error page)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error("Received HTML instead of JSON:", text.substring(0, 200));
        
        if (response.status === 401 || text.includes('login')) {
          console.warn("Admin not authenticated, redirecting to login");
          window.location.href = '/admin/login';
          return;
        }
        
        throw new Error(`Server returned ${response.status}: Expected JSON but got HTML`);
      }
      
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
        alert(`Failed to fetch success stories: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error fetching success stories:", error);
      alert(`Error loading success stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [searchParams, debouncedSearchTerm, statusFilter]);

  // Fetch users for dropdown
  const fetchUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // Only show loading spinner on initial load
    const isInitialLoad = successStories.length === 0 && debouncedSearchTerm === "" && statusFilter === 'all';
    fetchSuccessStories(isInitialLoad);
    if (isInitialLoad) {
      fetchUsers();
    }
  }, [fetchSuccessStories, fetchUsers, successStories.length, debouncedSearchTerm, statusFilter]);

  // Handle form submission - Only for editing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingStory) {
      toast.error("Admin cannot create new success stories. Only users can submit feedback with success stories.", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }
    
    // Check consent before allowing publish
    if (formData.isPublished && !editingStory.canSuccessStoryPost) {
      toast.error("Cannot publish this success story because the user did not give consent for publication.", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }
    
    try {
      const response = await fetch("/api/admin/success-stories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: editingStory._id,
          title: formData.title,
          isPublished: formData.isPublished
        }),
      });

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error("Received HTML instead of JSON:", text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: Expected JSON but got HTML`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Success story "${formData.title || editingStory.title}" updated successfully!`,
          { position: "top-right", autoClose: 3000 }
        );
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
        fetchSuccessStories(false);
      } else {
        toast.error(data.message || "Failed to update success story", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error updating success story:", error);
      toast.error(
        `Failed to update success story: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { position: "top-right", autoClose: 5000 }
      );
    }
  };

  // Handle delete
  const handleDelete = async (story: SuccessStory) => {
    const storyTitle = story.title || 'this success story';
    
    // Show confirmation toast
    const confirmToast = () => {
      return new Promise((resolve) => {
        const toastId = toast(
          <div className="flex flex-col space-y-3">
            <div className="font-medium text-red-600">
              Delete Success Story?
            </div>
            <div className="text-sm text-gray-600">
              "{storyTitle}"
            </div>
            <div className="text-xs text-red-500 font-medium">
              ⚠️ This action cannot be undone!
            </div>
            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(false);
                }}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(true);
                }}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>,
          {
            position: "top-center",
            autoClose: false,
            closeButton: false,
            draggable: false,
            closeOnClick: false,
          }
        );
      });
    };

    const confirmed = await confirmToast();
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/success-stories?id=${story._id}`, {
        method: "DELETE",
        credentials: "include", // Important for cookies
      });

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error("Received HTML instead of JSON:", text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: Expected JSON but got HTML`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Success story "${storyTitle}" deleted successfully!`,
          { position: "top-right", autoClose: 3000 }
        );
        fetchSuccessStories(false);
      } else {
        toast.error(data.message || "Failed to delete success story", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error deleting success story:", error);
      toast.error(
        `Failed to delete success story: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { position: "top-right", autoClose: 5000 }
      );
    }
  };

  // Handle toggle publish status
  const handleTogglePublish = async (story: SuccessStory) => {
    // Check if user gave consent before allowing publish
    if (!story.isPublished && !story.canSuccessStoryPost) {
      toast.error("Cannot publish this success story because the user did not give consent for publication.", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    // Show confirmation toast
    const storyTitle = story.title || 'this success story';
    
    const confirmToast = () => {
      return new Promise((resolve) => {
        const toastId = toast(
          <div className="flex flex-col space-y-3">
            <div className="font-medium text-gray-900">
              {story.isPublished ? 'Unpublish Story?' : 'Publish Story?'}
            </div>
            <div className="text-sm text-gray-600">
              "{storyTitle}"
            </div>
            <div className="text-xs text-gray-500">
              {story.isPublished 
                ? 'This will remove it from the public homepage.' 
                : 'This will make it visible on the public homepage.'}
            </div>
            <div className="flex space-x-2 justify-end">
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(false);
                }}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(toastId);
                  resolve(true);
                }}
                className={`px-3 py-1 text-xs text-white rounded transition-colors ${
                  story.isPublished 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {story.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>,
          {
            position: "top-center",
            autoClose: false,
            closeButton: false,
            draggable: false,
            closeOnClick: false,
          }
        );
      });
    };

    const confirmed = await confirmToast();
    if (!confirmed) {
      return;
    }
    
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

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error("Received HTML instead of JSON:", text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: Expected JSON but got HTML`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Success story ${story.isPublished ? 'unpublished' : 'published'} successfully!`,
          { position: "top-right", autoClose: 3000 }
        );
        fetchSuccessStories(false);
      } else {
        toast.error(data.message || "Failed to update success story", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error updating success story:", error);
      toast.error(
        `Failed to update success story: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { position: "top-right", autoClose: 5000 }
      );
    }
  };

  // Handle edit - Only title and publish status
  const handleEdit = (story: SuccessStory) => {
    setEditingStory(story);
    setFormData({
      userId: story.userId?._id || "",
      title: story.title,
      description: story.description,
      feedback: story.feedback || "General feedback",
      rating: story.rating || 5,
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
    <div className="w-full max-w-none -mx-6 px-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Success Stories Management</h1>
          <p className="text-gray-600 mt-1">Review and manage user success stories from feedback</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

      {/* Enhanced Filters */}
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Stories
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, user, or description... (Press Escape to clear)"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 transition-all duration-200 hover:border-gray-400 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {debouncedSearchTerm && (
              <div className="mt-2 text-xs text-gray-500">
                Found {successStories.length} result{successStories.length !== 1 ? 's' : ''} for "{debouncedSearchTerm}"
              </div>
            )}
          </div>
          <div className="flex-shrink-0 sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white appearance-none cursor-pointer hover:border-gray-400 transition-colors text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all" className="text-gray-900">All Stories ({totalStories})</option>
                <option value="published" className="text-gray-900">Published ({publishedStories})</option>
                <option value="unpublished" className="text-gray-900">Unpublished ({unpublishedStories})</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Active filters summary */}
        {(debouncedSearchTerm || statusFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              {debouncedSearchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: {debouncedSearchTerm}
                  <button
                    onClick={clearSearch}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                    title="Clear filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(debouncedSearchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    clearSearch();
                    setStatusFilter('all');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Stories Table */}
      <div className="w-full bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  User
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                  Title
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Rating
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Consent
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Status
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Created
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {successStories.map((story) => (
                <tr 
                  key={story._id} 
                  className={`transition-colors duration-200 ${
                    story.isPublished 
                      ? 'bg-green-50 hover:bg-green-100 border-l-4 border-green-400' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center min-w-0">
                      <div className="flex-shrink-0 h-8 w-8">
                        {story.userId?.avatar ? (
                          <div style={{ width: 32, height: 32 }} className="rounded-full overflow-hidden">
                            <Image
                              src={story.userId.avatar}
                              alt=""
                              width={32}
                              height={32}
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-2 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {story.isAnonymous ? "Anonymous" : (story.displayName || "Unknown User")}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {story.isAnonymous ? "Anonymous User" : (story.userId?.email || "No email")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 font-medium truncate">
                        {story.title}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {story.description.substring(0, 60) + '...'}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{story.rating}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                        story.canSuccessStoryPost
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {story.canSuccessStoryPost ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                        story.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {story.isPublished ? "Pub" : "Draft"}
                    </span>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <div className="text-xs text-gray-700">
                      {new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handleTogglePublish(story)}
                        disabled={!story.canSuccessStoryPost && !story.isPublished}
                        className={`p-1 rounded transition-all duration-200 ${
                          !story.canSuccessStoryPost && !story.isPublished
                            ? "text-gray-400 cursor-not-allowed"
                            : story.isPublished
                            ? "text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100 hover:scale-110"
                            : "text-green-600 hover:text-green-900 hover:bg-green-100 hover:scale-110"
                        }`}
                        title={
                          !story.canSuccessStoryPost && !story.isPublished
                            ? "Cannot publish without user consent - Click for confirmation"
                            : story.isPublished 
                            ? "Click to unpublish (will show confirmation)" 
                            : "Click to publish (will show confirmation)"
                        }
                      >
                        {story.isPublished ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(story)}
                        className="p-1 rounded text-blue-600 hover:text-blue-900 hover:bg-blue-100"
                        title="Edit title and publish status only"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(story)}
                        className="p-1 rounded text-red-600 hover:text-red-900 hover:bg-red-100 transition-all duration-200 hover:scale-110"
                        title="Click to delete (will show confirmation)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        {successStories.length === 0 && (
          <div className="text-center py-12 px-4">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No success stories found</p>
            <p className="text-gray-500 text-sm mt-1">Success stories come from user feedback submissions</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="w-full flex justify-center items-center mt-6 space-x-2">
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

      {/* Edit Form Modal - Only for editing titles and publish status */}
      {showCreateForm && editingStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Edit Success Story
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
            
            {/* Read-only information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Original Feedback Details (Read-only)</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>User:</strong> {editingStory.isAnonymous ? "Anonymous" : editingStory.displayName}</p>
                <p><strong>Rating:</strong> {editingStory.rating}/5 stars</p>
                <p><strong>User Consent:</strong> {editingStory.canSuccessStoryPost ? "Yes" : "No"}</p>
                <p><strong>Feedback:</strong> {editingStory.feedback}</p>
                <p><strong>Success Story:</strong> {editingStory.description}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-400 hover:border-gray-400 transition-colors"
                  placeholder="Enter custom title for this story"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  disabled={!editingStory.canSuccessStoryPost && !editingStory.isPublished}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="ml-3">
                  <label htmlFor="isPublished" className={`block text-sm font-medium ${!editingStory.canSuccessStoryPost && !editingStory.isPublished ? 'text-gray-400' : 'text-gray-900'}`}>
                    Publish story
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {!editingStory.canSuccessStoryPost && !editingStory.isPublished
                      ? "Cannot publish without user consent"
                      : "Make this story visible on the homepage"}
                  </p>
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
                  Update Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
