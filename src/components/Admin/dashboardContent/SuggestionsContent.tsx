'use client';

import { useState, useEffect } from 'react';
import { Eye, BarChart2, Filter, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { useDebounce } from 'use-debounce';

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

  const itemsPerPage = 5;

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
      s.userName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) &&
      (selectedCategory === 'All' || s.category === selectedCategory)
  );

  // Pagination
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
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="w-full h-full p-6 mt-7">
      {/* Top Buttons */}
      <div className="flex justify-end gap-2 mb-2">
        <button className="flex items-center gap-2 border border-[#026aa1] text-[#026aa1] px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-50 transition">
          <Eye className="w-4 h-4" />
          View Summary
        </button>
        <button className="flex items-center gap-2 border border-[#026aa1] text-[#026aa1] px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-50 transition">
          <BarChart2 className="w-4 h-4" />
          View Analysis
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between mt-7 mb-4 text-gray-900">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name"
            className="border rounded-lg p-2 w-64 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1 p-2 border rounded-lg hover:bg-gray-100"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <ChevronDown className="w-4 h-4" />
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsFilterOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      selectedCategory === category
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Showing {pendingSuggestions.length} Pending Suggestions
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        /* Table */
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="text-left bg-gray-100">
              <tr>
                <th scope="col" className="p-3">
                  <input type="checkbox" aria-label="Select all" />
                </th>
                <th scope="col" className="p-3">User</th>
                <th scope="col" className="p-3">Category</th>
                <th scope="col" className="p-3">Date</th>
                <th scope="col" className="p-3">Description</th>
                <th scope="col" className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSuggestions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No pending suggestions found.
                  </td>
                </tr>
              ) : (
                paginatedSuggestions.map((suggestion) => (
                  <tr key={suggestion._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <input type="checkbox" aria-label={`Select ${suggestion.userName}`} />
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      <img
                        src={suggestion.avatar}
                        alt={suggestion.userName}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{suggestion.userName}</div>
                        <div className="text-xs text-gray-400">{suggestion.role}</div>
                      </div>
                    </td>
                    <td className="p-3">{suggestion.category}</td>
                    <td className="p-3">{suggestion.date}</td>
                    <td className="p-3">
                      <button className="text-blue-500 underline text-sm">View</button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(suggestion._id, 'Approved')}
                          className="px-3 py-1 border-2 border-[#156722] bg-[#c5f3d0] text-[#156722] rounded-lg text-xs hover:bg-[#a8e6b8]"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(suggestion._id, 'Rejected')}
                          className="px-3 py-1 border-2 border-red-500 bg-[#f8e8e8] text-red-500 rounded-lg text-xs hover:bg-[#f0d0d0]"
                        >
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
      )}

      {/* Pagination */}
      {pendingSuggestions.length > 0 && (
        <div className="flex justify-end mt-4 text-sm text-gray-500">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="border px-2 rounded-lg disabled:opacity-50 hover:bg-gray-100"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage * itemsPerPage >= pendingSuggestions.length}
              className="border px-2 rounded-lg disabled:opacity-50 hover:bg-gray-100"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}