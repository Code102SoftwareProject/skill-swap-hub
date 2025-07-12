'use client';

import { useState, useEffect } from 'react';
import { Eye, BarChart2, Filter, Loader2, ChevronDown, Search, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import { processAvatarUrl } from '@/utils/avatarUtils';

interface Suggestion {
  _id: string;
  userName: string;
  role: string;
  avatar: string;
  category: string;
  date: string;
  title: string;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function SuggestionsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalysisClosing, setIsAnalysisClosing] = useState(false);

  const itemsPerPage = 8;

  // Fetch suggestions
  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/suggestions');
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Get unique categories
  const categories = ['All', ...new Set(suggestions.map((s) => s.category))];

  // Filter suggestions by status, search term, and category
  const pendingSuggestions = suggestions.filter(
    (s) =>
      s.status === 'Pending' &&
      (s.userName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
       s.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) &&
      (selectedCategory === 'All' || s.category === selectedCategory)
  );

  // Pagination
  const totalPages = Math.ceil(pendingSuggestions.length / itemsPerPage);
  const paginatedSuggestions = pendingSuggestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Update suggestion status
  const updateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success(`Suggestion ${status.toLowerCase()} successfully!`);
      fetchSuggestions();
      if (selectedSuggestion) setSelectedSuggestion(null);
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update status');
    }
  };

  // Close modal with animation
  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedSuggestion(null);
      setIsModalClosing(false);
    }, 300);
  };

  // Close analysis modal with animation
  const closeAnalysisModal = () => {
    setIsAnalysisClosing(true);
    setTimeout(() => {
      setShowAnalysis(false);
      setIsAnalysisClosing(false);
    }, 300);
  };

  // Analysis data processing
  const getAnalysisData = () => {
    const categoryStats = suggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = { total: 0, pending: 0, approved: 0, rejected: 0 };
      }
      acc[suggestion.category].total++;
      
      if (suggestion.status === 'Pending') acc[suggestion.category].pending++;
      else if (suggestion.status === 'Approved') acc[suggestion.category].approved++;
      else if (suggestion.status === 'Rejected') acc[suggestion.category].rejected++;
      
      return acc;
    }, {} as Record<string, { total: number; pending: number; approved: number; rejected: number }>);

    const statusStats = suggestions.reduce((acc, suggestion) => {
      acc[suggestion.status] = (acc[suggestion.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyStats = suggestions.reduce((acc, suggestion) => {
      const date = new Date(suggestion.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { categoryStats, statusStats, monthlyStats };
  };

  return (
    <div className="w-full h-full p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Suggestions Review</h1>
          <p className="text-gray-500">Manage and review user-submitted suggestions</p>
        </div>
        
        {/* Top Buttons */}
        <div className="flex gap-3 mt-4 md:mt-0">
          <button className="flex items-center gap-2 bg-white border border-blue-100 text-[#026aa1] px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-all shadow-sm hover:shadow-md">
            <Eye className="w-4 h-4" />
            View Summary
          </button>
          <button 
            onClick={() => setShowAnalysis(true)}
            className="flex items-center gap-2 bg-white border border-blue-100 text-[#026aa1] px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
          >
            <BarChart2 className="w-4 h-4" />
            View Analysis
          </button>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100 text-gray-600">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or title..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 w-full md:w-40 px-3 py-2 border rounded-lg text-sm font-medium transition-all ${isFilterOpen ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <Filter className="w-4 h-4" />
                <span>{selectedCategory === 'All' ? 'Filter' : selectedCategory}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsFilterOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="hidden md:block text-sm text-gray-500 whitespace-nowrap">
              {pendingSuggestions.length} {pendingSuggestions.length === 1 ? 'suggestion' : 'suggestions'} pending
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-gray-500">Loading suggestions...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden">
              {paginatedSuggestions.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-500">No pending suggestions found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {paginatedSuggestions.map((suggestion) => (
                    <div key={suggestion._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {/* User Info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 relative">
                            <Image
                              src={processAvatarUrl(suggestion.avatar) || '/default-avatar.png'}
                              alt={suggestion.userName}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{suggestion.userName}</div>
                            <div className="text-xs text-gray-500">{suggestion.role}</div>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {suggestion.category}
                        </span>
                      </div>

                      {/* Title and Date */}
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{suggestion.title}</h3>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(suggestion.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedSuggestion(suggestion)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View details
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(suggestion._id, 'Approved')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(suggestion._id, 'Rejected')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-xs font-medium hover:bg-red-100 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedSuggestions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-500">No pending suggestions found</p>
                            <p className="text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedSuggestions.map((suggestion) => (
                        <tr key={suggestion._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 relative">
                                <Image
                                  src={processAvatarUrl(suggestion.avatar) || '/default-avatar.png'}
                                  alt={suggestion.userName}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{suggestion.userName}</div>
                                <div className="text-xs text-gray-500">{suggestion.role}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {suggestion.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(suggestion.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-medium line-clamp-1">{suggestion.title}</div>
                            <button 
                              onClick={() => setSelectedSuggestion(suggestion)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1"
                            >
                              View details
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => updateStatus(suggestion._id, 'Approved')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => updateStatus(suggestion._id, 'Rejected')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-md text-xs font-medium hover:bg-red-100 transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pendingSuggestions.length > 0 && (
              <div className="bg-gray-50 px-6 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, pendingSuggestions.length)}</span> of{' '}
                  <span className="font-medium">{pendingSuggestions.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-3 py-1 text-sm text-gray-500">...</span>
                  )}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Suggestion Details Modal */}
      {selectedSuggestion && (
        <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity ${isModalClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`bg-white rounded-xl overflow-hidden w-[95%] max-w-4xl shadow-2xl relative transition-all ${isModalClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Suggestion Details</h2>
                  <p className="text-sm opacity-90 mt-1">
                    Submitted on {new Date(selectedSuggestion.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* User Profile Section */}
            <div className="px-6 pt-4 -mt-8">
              <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden border-2 border-white shadow">
                    {selectedSuggestion.avatar ? (
                      <Image 
                        src={processAvatarUrl(selectedSuggestion.avatar) || '/default-avatar.png'} 
                        alt={selectedSuggestion.userName}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-medium text-lg">
                        {selectedSuggestion.userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedSuggestion.userName}</h3>
                  <p className="text-sm text-gray-500">{selectedSuggestion.role}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {selectedSuggestion.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-6">
              {/* Title Card */}
              <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-5 transition-all hover:shadow-sm">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-500 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                    </svg>
                  </div>
                  <span>Title</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-lg">{selectedSuggestion.title}</h4>
              </div>

              {/* Description Card */}
              <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-5 transition-all hover:shadow-sm">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-500 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </div>
                  <span>Description</span>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {selectedSuggestion.description.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                      {paragraph || <br />}
                    </p>
                  ))}
                </div>
              </div>

              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-blue-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    </svg>
                    <span>Category</span>
                  </div>
                  <div className="text-sm font-semibold text-blue-900">{selectedSuggestion.category}</div>
                </div>

                {/* Status Card */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-100 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-yellow-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Status</span>
                  </div>
                  <div className="text-sm font-semibold text-yellow-900">Pending Review</div>
                </div>

                {/* Date Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Submitted</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(selectedSuggestion.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 pt-4 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2 justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Close
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus(selectedSuggestion._id, 'Rejected')}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm flex items-center gap-2 justify-center flex-1 sm:flex-none"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => updateStatus(selectedSuggestion._id, 'Approved')}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all shadow-sm flex items-center gap-2 justify-center flex-1 sm:flex-none"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysis && (
        <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity ${isAnalysisClosing ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`bg-white rounded-xl overflow-hidden w-[95%] max-w-6xl max-h-[90vh] shadow-2xl relative transition-all ${isAnalysisClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Suggestions Analysis</h2>
                  <p className="text-sm opacity-90 mt-1">Comprehensive overview of all suggestions by category and status</p>
                </div>
                <button
                  onClick={closeAnalysisModal}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {(() => {
                const { categoryStats, statusStats, monthlyStats } = getAnalysisData();
                const totalSuggestions = suggestions.length;
                
                return (
                  <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Total Suggestions</p>
                            <p className="text-2xl font-bold text-blue-900">{totalSuggestions}</p>
                          </div>
                          <div className="p-2 bg-blue-200 rounded-lg">
                            <BarChart2 className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-900">{statusStats.Pending || 0}</p>
                          </div>
                          <div className="p-2 bg-yellow-200 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">Approved</p>
                            <p className="text-2xl font-bold text-green-900">{statusStats.Approved || 0}</p>
                          </div>
                          <div className="p-2 bg-green-200 rounded-lg">
                            <Check className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-600">Rejected</p>
                            <p className="text-2xl font-bold text-red-900">{statusStats.Rejected || 0}</p>
                          </div>
                          <div className="p-2 bg-red-200 rounded-lg">
                            <X className="w-6 h-6 text-red-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category Analysis */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions by Category</h3>
                      <div className="space-y-4">
                        {Object.entries(categoryStats).map(([category, stats]) => (
                          <div key={category} className="border border-gray-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">{category}</h4>
                              <span className="text-sm font-medium text-gray-500">Total: {stats.total}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                                <div className="text-xs text-gray-500">Pending</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                                <div className="text-xs text-gray-500">Approved</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                                <div className="text-xs text-gray-500">Rejected</div>
                              </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-3">
                              <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="bg-yellow-500 h-full transition-all duration-300"
                                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                                ></div>
                                <div 
                                  className="bg-green-500 h-full transition-all duration-300"
                                  style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                                ></div>
                                <div 
                                  className="bg-red-500 h-full transition-all duration-300"
                                  style={{ width: `${(stats.rejected / stats.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
                      <div className="space-y-3">
                        {Object.entries(monthlyStats)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([monthYear, count]) => {
                            const [year, month] = monthYear.split('-');
                            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                            
                            return (
                              <div key={monthYear} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">{monthName}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${(count / Math.max(...Object.values(monthlyStats))) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-600 min-w-[2rem] text-right">{count}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Status Distribution Chart */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                      <div className="flex items-center justify-center h-64">
                        <div className="relative w-48 h-48">
                          {/* Simple Pie Chart */}
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {(() => {
                              const total = Object.values(statusStats).reduce((sum, count) => sum + count, 0);
                              let currentAngle = 0;
                              
                              return Object.entries(statusStats).map(([status, count], index) => {
                                const percentage = total > 0 ? (count / total) * 100 : 0;
                                const angle = (percentage / 100) * 360;
                                const radius = 40;
                                const x1 = 50 + radius * Math.cos((currentAngle * Math.PI) / 180);
                                const y1 = 50 + radius * Math.sin((currentAngle * Math.PI) / 180);
                                const x2 = 50 + radius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
                                const y2 = 50 + radius * Math.sin(((currentAngle + angle) * Math.PI) / 180);
                                
                                const largeArcFlag = angle > 180 ? 1 : 0;
                                const pathData = [
                                  `M 50 50`,
                                  `L ${x1} ${y1}`,
                                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                  'Z'
                                ].join(' ');
                                
                                const colors = ['#fbbf24', '#10b981', '#ef4444'];
                                const color = colors[index % colors.length];
                                
                                currentAngle += angle;
                                
                                return (
                                  <path
                                    key={status}
                                    d={pathData}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth="2"
                                  />
                                );
                              });
                            })()}
                          </svg>
                          
                          {/* Center Label */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-700">{totalSuggestions}</div>
                              <div className="text-sm text-gray-500">Total</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="flex justify-center gap-6 mt-4">
                        {Object.entries(statusStats).map(([status, count], index) => {
                          const colors = ['#fbbf24', '#10b981', '#ef4444'];
                          const color = colors[index % colors.length];
                          
                          return (
                            <div key={status} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                              <span className="text-sm text-gray-600">{status}: {count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}