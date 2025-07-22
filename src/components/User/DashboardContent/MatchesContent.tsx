'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { useAuth } from '@/lib/context/AuthContext';
import { findMatches, getMatches } from '@/services/matchService';
import { SkillMatch, MatchFilters } from '@/types/skillMatch';
import MatchCard from '@/components/Dashboard/matches/MatchCard';
import MatchDetailsModal from '@/components/Dashboard/matches/MatchDetailsModal';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle, 
  MessageCircle,
  Calendar,
  Target,
  Award,
  Activity,
  ChevronDown,
  RefreshCw,
  Plus
} from 'lucide-react';

const MatchesPage = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allMatches, setAllMatches] = useState<SkillMatch[]>([]); // Keep all matches for counting
  const [matches, setMatches] = useState<SkillMatch[]>([]); // Currently displayed matches
  const [selectedMatch, setSelectedMatch] = useState<SkillMatch | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'exact' | 'partial'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom dropdown states for mobile
  const [showMatchTypeDropdown, setShowMatchTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Get current user ID
  const currentUserId = user?._id;

  // Fetch matches on component mount
  useEffect(() => {
    if (currentUserId) {
      fetchMatches();
    }
  }, [currentUserId]);

  // Function to fetch matches with optional filters
  const fetchMatches = async (filters?: MatchFilters) => {
    setLoading(true);
    try {
      const response = await getMatches(filters?.matchType, filters?.status);
      
      if (response.success && response.data) {
        setMatches(response.data);
        // If no filters, this represents all matches
        if (!filters?.matchType && !filters?.status) {
          setAllMatches(response.data);
        }
      } else {
        showToast(response.message || 'Failed to load matches', 'error');
      }
    } catch (error) {
      console.error('Error in fetchMatches:', error);
      showToast('Error loading matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to find new matches
  const handleFindMatches = async () => {
    setRefreshing(true);
    try {
      const response = await findMatches();
      
      if (response.success) {
        showToast(response.message || 'Successfully found matches', 'success');
        // Refresh all matches to update counts and filtered view
        const refreshResponse = await getMatches();
        if (refreshResponse.success && refreshResponse.data) {
          setAllMatches(refreshResponse.data);
          // Reapply current filter
          if (activeFilter === 'all') {
            setMatches(refreshResponse.data);
          } else {
            const filteredMatches = refreshResponse.data.filter(match => match.matchType === activeFilter);
            setMatches(filteredMatches);
          }
        }
      } else {
        showToast(response.message || 'Failed to find matches', 'error');
      }
    } catch (error) {
      console.error('Error in handleFindMatches:', error);
      showToast('Error finding new matches', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Function to handle filter changes
  const handleFilterChange = (filter: 'all' | 'exact' | 'partial') => {
    setActiveFilter(filter);
    applyAllFilters(filter, statusFilter, searchTerm);
  };

  // Function to handle status filter changes
  const handleStatusFilterChange = (status: 'all' | 'pending' | 'accepted' | 'rejected') => {
    setStatusFilter(status);
    applyAllFilters(activeFilter, status, searchTerm);
  };

  // Function to handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyAllFilters(activeFilter, statusFilter, term);
  };

  // Function to apply all filters
  const applyAllFilters = (matchFilter: string, statusFilterValue: string, searchFilterValue: string) => {
    let filtered = allMatches;
    
    // Match type filter
    if (matchFilter !== 'all') {
      filtered = filtered.filter(match => match.matchType === matchFilter);
    }
    
    // Status filter
    if (statusFilterValue !== 'all') {
      filtered = filtered.filter(match => match.status === statusFilterValue);
    }
    
    // Search filter
    if (searchFilterValue.trim()) {
      const searchLower = searchFilterValue.toLowerCase();
      filtered = filtered.filter(match => 
        match.otherUser.firstName.toLowerCase().includes(searchLower) ||
        match.otherUser.lastName.toLowerCase().includes(searchLower) ||
        match.myDetails.offeringSkill.toLowerCase().includes(searchLower) ||
        match.myDetails.seekingSkill.toLowerCase().includes(searchLower) ||
        match.otherUser.offeringSkill.toLowerCase().includes(searchLower) ||
        match.otherUser.seekingSkill.toLowerCase().includes(searchLower)
      );
    }
    
    setMatches(filtered);
  };

  // Function to view match details
  const viewMatchDetails = (match: SkillMatch) => {
    setSelectedMatch(match);
  };

  // Function to close match details modal
  const closeMatchDetails = () => {
    setSelectedMatch(null);
    // Refresh matches when modal is closed (in case status was updated)
    const refreshAndReapplyFilter = async () => {
      const refreshResponse = await getMatches();
      if (refreshResponse.success && refreshResponse.data) {
        setAllMatches(refreshResponse.data);
        // Reapply current filter
        if (activeFilter === 'all') {
          setMatches(refreshResponse.data);
        } else {
          const filteredMatches = refreshResponse.data.filter(match => match.matchType === activeFilter);
          setMatches(filteredMatches);
        }
      }
    };
    refreshAndReapplyFilter();
  };

  // Calculate statistics using useMemo for performance
  const matchStats = useMemo(() => {
    const total = allMatches.length;
    const exactMatches = allMatches.filter(match => match.matchType === 'exact');
    const partialMatches = allMatches.filter(match => match.matchType === 'partial');
    const pendingMatches = allMatches.filter(match => match.status === 'pending');
    const acceptedMatches = allMatches.filter(match => match.status === 'accepted');
    // Removed completed matches from stats
    const rejectedMatches = allMatches.filter(match => match.status === 'rejected');
    
    return {
      total,
      exact: exactMatches.length,
      partial: partialMatches.length,
      pending: pendingMatches.length,
      accepted: acceptedMatches.length,
      // completed: removed from stats,
      rejected: rejectedMatches.length,
      successRate: total > 0 ? Math.round(acceptedMatches.length / total * 100) : 0
    };
  }, [allMatches]);

  // Determine which matches to show based on filter
  const matchesToShow = matches;
  
  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowMatchTypeDropdown(false);
    setShowStatusDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-dropdown')) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Custom dropdown component for mobile
  const CustomDropdown = ({ 
    value, 
    options, 
    onChange, 
    placeholder, 
    isOpen, 
    setIsOpen, 
    className = ""
  }: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    placeholder: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    className?: string;
  }) => (
    <div className={`custom-dropdown relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          closeAllDropdowns();
          setIsOpen(!isOpen);
        }}
        className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 text-left flex items-center justify-between"
      >
        <span className="truncate">
          {options.find(opt => opt.value === value)?.label || placeholder}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-50 ${
                value === option.value ? 'bg-blue-100 text-blue-800' : 'text-gray-900'
              }`}
            >
              <span className="block truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Don't render if user is not authenticated
  if (!currentUserId) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Please log in to view matches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Skill Matches</h1>
        <button
          onClick={handleFindMatches}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 text-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Finding Matches...' : 'Find New Matches'}
        </button>
      </div>

      {/* Enhanced Statistics Cards - Centered */}
      {!loading && allMatches.length > 0 && (
        <div className="flex justify-center mb-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-w-4xl">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-md p-2 text-center">
              <div className="flex justify-center mb-1">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-blue-800">{matchStats.total}</div>
              <div className="text-xs text-blue-600">Total Matches</div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-md p-2 text-center">
              <div className="flex justify-center mb-1">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-lg font-bold text-green-800">{matchStats.exact}</div>
              <div className="text-xs text-green-600">Exact</div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-md p-2 text-center">
              <div className="flex justify-center mb-1">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-purple-800">{matchStats.partial}</div>
              <div className="text-xs text-purple-600">Partial</div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-md p-2 text-center">
              <div className="flex justify-center mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-lg font-bold text-yellow-800">{matchStats.pending}</div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-md p-2 text-center">
              <div className="flex justify-center mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-emerald-800">{matchStats.accepted}</div>
              <div className="text-xs text-emerald-600">Accepted</div>
            </div>
            
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-md p-2 text-center">
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-lg font-bold text-teal-800">{matchStats.successRate}%</div>
              <div className="text-xs text-teal-600">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {allMatches.length > 0 && (
        <div className="bg-white rounded-md shadow-sm border p-3 mb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Search - Full width on mobile */}
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search matches..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded text-gray-900 placeholder-gray-500 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Use custom dropdowns for mobile responsiveness */}
            <div className="block sm:hidden">
              <CustomDropdown
                value={activeFilter}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'exact', label: 'Exact' },
                  { value: 'partial', label: 'Partial' }
                ]}
                onChange={(value) => handleFilterChange(value as 'all' | 'exact' | 'partial')}
                placeholder="All Types"
                isOpen={showMatchTypeDropdown}
                setIsOpen={setShowMatchTypeDropdown}
              />
            </div>

            <div className="block sm:hidden">
              <CustomDropdown
                value={statusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'rejected', label: 'Rejected' }
                ]}
                onChange={(value) => handleStatusFilterChange(value as 'all' | 'pending' | 'accepted' | 'rejected')}
                placeholder="All Status"
                isOpen={showStatusDropdown}
                setIsOpen={setShowStatusDropdown}
              />
            </div>

            {/* Desktop dropdowns */}
            <div className="hidden sm:block">
              <select
                value={activeFilter}
                onChange={(e) => handleFilterChange(e.target.value as 'all' | 'exact' | 'partial')}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">All Types</option>
                <option value="exact">Exact Matches</option>
                <option value="partial">Partial Matches</option>
              </select>
            </div>

            <div className="hidden sm:block">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'pending' | 'accepted' | 'rejected')}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Compact Info Row */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
        <div>
          {allMatches.length > 0 && (
            <span>Showing {matchesToShow.length} of {allMatches.length} matches</span>
          )}
        </div>
        <div>
          {matchStats.accepted > 0 && (
            <div className="flex items-center bg-green-50 border border-green-200 rounded px-2 py-1">
              <MessageCircle className="w-3 h-3 text-green-600 mr-1" />
              <span className="text-green-700">
                {matchStats.accepted} active chat{matchStats.accepted > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>


      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : matchesToShow.length === 0 && allMatches.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No matches match your filters</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
              setStatusFilter('all');
              closeAllDropdowns();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      ) : allMatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No skill matches yet</h3>
          <p className="text-gray-600 mb-6">Start by finding matches with other users who have complementary skills</p>
          <button
            onClick={handleFindMatches}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            disabled={refreshing}
          >
            <Plus className="w-4 h-4 mr-2" />
            {refreshing ? 'Finding Matches...' : 'Find Your First Match'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group matches by status for better organization */}
          {['pending', 'accepted', 'rejected'].map(status => {
            const statusMatches = matchesToShow.filter(match => match.status === status);
            if (statusMatches.length === 0) return null;
            
            const statusConfig = {
              pending: { title: 'Pending Matches', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
              accepted: { title: 'Active Matches', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
              rejected: { title: 'Declined Matches', icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' }
            }[status];
            
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={status} className={`rounded-lg border ${statusConfig.border} ${statusConfig.bg} p-4`}>
                <div className="flex items-center mb-4">
                  <StatusIcon className={`w-5 h-5 ${statusConfig.color} mr-2`} />
                  <h2 className={`text-lg font-semibold ${statusConfig.color}`}>
                    {statusConfig.title} ({statusMatches.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusMatches.map(match => (
                    <MatchCard 
                      key={match.id} 
                      match={match} 
                      onClick={() => viewMatchDetails(match)} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Details Modal */}
      {selectedMatch && currentUserId && (
        <MatchDetailsModal 
          match={selectedMatch} 
          currentUserId={currentUserId}
          onClose={closeMatchDetails} 
        />
      )}
    </div>
  );
};

export default MatchesPage;