// File: src/components/User/DashboardContent/ListingsContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { getListings, deleteListing } from '@/services/listingService';
import { getUserSkills } from '@/services/skillService';
import { getListingsUsedInMatches } from '@/services/trendingService';
import { SkillListing } from '@/types/skillListing';
import { UserSkill } from '@/types/userSkill';
import { useToast } from '@/lib/context/ToastContext';
import ListingCard from '@/components/Dashboard/listings/ListingCard';
import NewListingForm from '@/components/Dashboard/listings/NewListingForm';
import EditListingForm from '@/components/Dashboard/listings/EditListingForm';
import ConfirmationModal from '@/components/Dashboard/listings/ConfirmationModal';
import { 
  Plus, 
  Filter, 
  Search, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface ListingWithMatchStatus extends SkillListing {
  isUsedInMatches?: boolean;
  matchDetails?: any[];
}

const ListingsContent: React.FC = () => {
  const { showToast } = useToast();
  
  // State management
  const [listings, setListings] = useState<ListingWithMatchStatus[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingListing, setEditingListing] = useState<SkillListing | null>(null);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Delete confirmation state
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    matched: 0,
    completed: 0,
    inMatches: 0
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Update stats when listings change
  useEffect(() => {
    updateStats();
  }, [listings]);

  // Function to fetch user listings and skills
  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user's listings
      const listingsResponse = await getListings('mine'); // Get only user's listings
      
      // Fetch user's skills for form
      const skillsResponse = await getUserSkills();
      
      // Fetch listings used in matches (efficient batch call)
      const matchUsageResponse = await getListingsUsedInMatches();
      
      if (listingsResponse.success && listingsResponse.data) {
        let listingsWithMatchStatus: ListingWithMatchStatus[] = [];
        
        if (matchUsageResponse.success && matchUsageResponse.data) {
          const { usedListingIds, listingMatchDetails } = matchUsageResponse.data;
          
          // Map listings with match status
          listingsWithMatchStatus = (listingsResponse.data as SkillListing[]).map(listing => ({
            ...listing,
            isUsedInMatches: usedListingIds.includes(listing.id),
            matchDetails: listingMatchDetails[listing.id] || []
          }));
        } else {
          // Fallback: no match data available
          listingsWithMatchStatus = (listingsResponse.data as SkillListing[]).map(listing => ({
            ...listing,
            isUsedInMatches: false,
            matchDetails: []
          }));
        }
        
        setListings(listingsWithMatchStatus);
      } else {
        showToast(listingsResponse.message || 'Failed to load listings', 'error');
      }
      
      if (skillsResponse.success && skillsResponse.data) {
        setUserSkills(skillsResponse.data as UserSkill[]);
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update statistics
  const updateStats = () => {
    const total = listings.length;
    const active = listings.filter(l => l.status === 'active').length;
    const matched = listings.filter(l => l.status === 'matched').length;
    const completed = listings.filter(l => l.status === 'completed').length;
    const inMatches = listings.filter(l => l.isUsedInMatches).length;
    
    setStats({ total, active, matched, completed, inMatches });
  };

  // Handle listing deletion confirmation
  const confirmDeleteListing = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    // Check if listing can be deleted (not in active matches)
    if (listing.isUsedInMatches) {
      const matchStatuses = listing.matchDetails?.map(m => `${m.matchType} (${m.status})`).join(', ') || '';
      showToast(`This listing cannot be deleted because it is involved in active skill matches: ${matchStatuses}`, 'error');
      return;
    }
    
    setDeletingListingId(listingId);
    setShowDeleteConfirmation(true);
  };

  // Handle listing deletion
  const handleDeleteListing = async () => {
    if (!deletingListingId) {
      setShowDeleteConfirmation(false);
      return;
    }
    
    try {
      const response = await deleteListing(deletingListingId);
      
      if (response.success) {
        showToast('Listing deleted successfully', 'success');
        // Refresh the listings
        fetchUserData();
      } else {
        showToast(response.message || 'Failed to delete listing', 'error');
      }
    } catch (error) {
      console.error('Error in handleDeleteListing:', error);
      showToast('Error deleting listing', 'error');
    } finally {
      // Reset deletion state
      setDeletingListingId(null);
      setShowDeleteConfirmation(false);
    }
  };

  // Handle listing edit
  const handleEditListing = (listing: SkillListing) => {
    // Check if listing can be edited (not in active matches)
    const listingWithStatus = listings.find(l => l.id === listing.id) as ListingWithMatchStatus;
    
    if (listingWithStatus?.isUsedInMatches) {
      const matchStatuses = listingWithStatus.matchDetails?.map(m => `${m.matchType} (${m.status})`).join(', ') || '';
      showToast(`This listing cannot be edited because it is involved in active skill matches: ${matchStatuses}`, 'error');
      return;
    }
    
    setEditingListing(listing);
  };

  // Handle form success
  const handleFormSuccess = () => {
    fetchUserData();
    setShowNewForm(false);
    setEditingListing(null);
  };

  // Get unique categories for filter
  const getUniqueCategories = () => {
    const categories = new Set<string>();
    listings.forEach(listing => {
      categories.add(listing.offering.categoryName);
      categories.add(listing.seeking.categoryName);
    });
    return Array.from(categories).sort();
  };

  // Filter listings based on search and filters
  const filteredListings = listings.filter(listing => {
    // Search filter
    const searchMatch = searchTerm === '' || 
      listing.offering.skillTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.seeking.skillTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.additionalInfo.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const statusMatch = statusFilter === 'all' || listing.status === statusFilter;
    
    // Category filter
    const categoryMatch = categoryFilter === 'all' || 
      listing.offering.categoryName === categoryFilter ||
      listing.seeking.categoryName === categoryFilter;

    return searchMatch && statusMatch && categoryMatch;
  });

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-600 bg-green-100', icon: CheckCircle, text: 'Active' };
      case 'matched':
        return { color: 'text-blue-600 bg-blue-100', icon: Users, text: 'Matched' };
      case 'completed':
        return { color: 'text-purple-600 bg-purple-100', icon: CheckCircle, text: 'Completed' };
      case 'cancelled':
        return { color: 'text-red-600 bg-red-100', icon: XCircle, text: 'Cancelled' };
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: Clock, text: 'Unknown' };
    }
  };

  // Render statistics cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <Calendar className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Total Listings</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <Users className="w-8 h-8 text-blue-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Matched</p>
            <p className="text-2xl font-bold text-blue-600">{stats.matched}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center">
          <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">In Matches</p>
            <p className="text-2xl font-bold text-orange-600">{stats.inMatches}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">My Skill Listings</h1>
          <p className="text-gray-600">Manage your skill exchange listings and track their status</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          disabled={userSkills.length === 0}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Listing
        </button>
      </div>

      {/* Skills warning */}
      {userSkills.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">No Skills Added</h3>
              <p className="text-sm text-yellow-700">
                You need to add skills to your profile before creating listings. 
                <a href="/dashboard?component=myskill" className="ml-1 font-medium underline hover:no-underline">
                  Add skills now
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {!loading && listings.length > 0 && renderStatsCards()}

      {/* Info banner about match protection */}
      {stats.inMatches > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <Users className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">Active Match Protection</h3>
              <p className="text-sm text-orange-700">
                {stats.inMatches} of your listing{stats.inMatches > 1 ? 's are' : ' is'} currently involved in active skill matches. 
                These listings cannot be modified until the matches are completed or cancelled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {!loading && listings.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search skills, descriptions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="matched">Matched</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters display */}
          {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                  Category: {categoryFilter}
                  <button onClick={() => setCategoryFilter('all')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                </span>
              )}
            </div>
          )}

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredListings.length} of {listings.length} listings
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && listings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No listings yet</h3>
          <p className="text-gray-500 mb-6">Create your first skill listing to start connecting with other learners</p>
          {userSkills.length > 0 ? (
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Listing
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">First, add some skills to your profile:</p>
              <a
                href="/dashboard?component=myskill"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Skills First
              </a>
            </div>
          )}
        </div>
      )}

      {/* No Results State */}
      {!loading && listings.length > 0 && filteredListings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No listings found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onDelete={confirmDeleteListing}
              onEdit={handleEditListing}
            />
          ))}
        </div>
      )}

      {/* New Listing Form Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Create New Listing</h2>
                <button 
                  onClick={() => setShowNewForm(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <NewListingForm 
                onSuccess={handleFormSuccess} 
                onCancel={() => setShowNewForm(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Form Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Edit Listing</h2>
                <button 
                  onClick={() => setEditingListing(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <EditListingForm 
                listing={editingListing} 
                onSuccess={handleFormSuccess} 
                onCancel={() => setEditingListing(null)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteListing}
        onCancel={() => {
          setDeletingListingId(null);
          setShowDeleteConfirmation(false);
        }}
      />
    </div>
  );
};

export default ListingsContent;