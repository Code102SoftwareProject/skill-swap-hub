'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { findMatches, getMatches } from '@/services/matchService';
import { SkillMatch, MatchFilters } from '@/types/skillMatch';
import MatchCard from '@/components/Dashboard/matches/MatchCard';
import MatchDetailsModal from '@/components/Dashboard/matches/MatchDetailsModal';

const MatchesPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<SkillMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<SkillMatch | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'exact' | 'partial'>('all');
  
  // Fetch matches on component mount
  useEffect(() => {
    fetchMatches();
  }, []);

  // Function to fetch matches with optional filters
  const fetchMatches = async (filters?: MatchFilters) => {
    setLoading(true);
    try {
      const response = await getMatches(filters?.matchType, filters?.status);
      
      if (response.success && response.data) {
        setMatches(response.data);
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
        // Refresh the matches list
        fetchMatches({ matchType: activeFilter === 'all' ? undefined : activeFilter });
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
    
    // Apply the filter
    if (filter === 'all') {
      fetchMatches();
    } else {
      fetchMatches({ matchType: filter });
    }
  };

  // Function to view match details
  const viewMatchDetails = (match: SkillMatch) => {
    setSelectedMatch(match);
  };

  // Function to close match details modal
  const closeMatchDetails = () => {
    setSelectedMatch(null);
    // Refresh matches when modal is closed (in case status was updated)
    fetchMatches({ matchType: activeFilter === 'all' ? undefined : activeFilter });
  };

  // Filter matches by type (for UI rendering)
  const exactMatches = matches.filter(match => match.matchType === 'exact');
  const partialMatches = matches.filter(match => match.matchType === 'partial');

  // Determine which matches to show based on filter
  const matchesToShow = activeFilter === 'all' ? 
    matches : 
    activeFilter === 'exact' ? 
      exactMatches : 
      partialMatches;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Skill Matches</h1>
        <button
          onClick={handleFindMatches}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
        >
          {refreshing ? 'Finding Matches...' : 'Find New Matches'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex">
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeFilter === 'all' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleFilterChange('all')}
          >
            All Matches
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeFilter === 'exact' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleFilterChange('exact')}
          >
            Exact Matches
          </button>
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeFilter === 'partial' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleFilterChange('partial')}
          >
            Partial Matches
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : matchesToShow.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No matches found</h3>
          <p className="text-gray-500 mb-4">
            {activeFilter === 'all' 
              ? "You don't have any matches yet" 
              : `You don't have any ${activeFilter} matches yet`}
          </p>
          <button
            onClick={handleFindMatches}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={refreshing}
          >
            {refreshing ? 'Finding Matches...' : 'Find New Matches'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchesToShow.map(match => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onClick={() => viewMatchDetails(match)} 
            />
          ))}
        </div>
      )}

      {/* Match Details Modal */}
      {selectedMatch && (
        <MatchDetailsModal 
          match={selectedMatch} 
          onClose={closeMatchDetails} 
        />
      )}
    </div>
  );
};

export default MatchesPage;

