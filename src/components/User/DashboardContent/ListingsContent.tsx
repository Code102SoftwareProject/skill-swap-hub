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
  Calendar,
  ChevronDown,
  BarChart3,
  Target,
  Activity,
  Shield
} from 'lucide-react';

interface ListingWithMatchStatus extends SkillListing {
  isUsedInMatches?: boolean;
  matchDetails?: any[];
}

interface ListingsContentProps {
  onNavigateToSkills?: () => void;
}

const ListingsContent: React.FC<ListingsContentProps> = ({ onNavigateToSkills }) => {
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
  
  // Custom dropdown states for mobile
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  // Delete confirmation state
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    notActive: 0,
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

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowStatusDropdown(false);
    setShowCategoryDropdown(false);
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
    const notActive = listings.filter(l => l.status === 'not active').length;
    const inMatches = listings.filter(l => l.isUsedInMatches).length;
    
    setStats({ total, active, notActive, inMatches });
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

  // Custom dropdown component for mobile
  const CustomDropdown = ({ 
    value, 
    options, 
    onChange, 
    placeholder, 
    isOpen, 
    setIsOpen, 
    renderValue,
    className = ""
  }: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    placeholder: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    renderValue?: (value: string) => string;
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
          {renderValue ? renderValue(value) : (options.find(opt => opt.value === value)?.label || placeholder)}
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

  // Render enhanced statistics cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-md p-2 text-center">
        <div className="flex justify-center mb-1">
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-lg font-bold text-blue-800">{stats.total}</div>
        <div className="text-xs text-blue-600">Total Listings</div>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-md p-2 text-center">
        <div className="flex justify-center mb-1">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        <div className="text-lg font-bold text-green-800">{stats.active}</div>
        <div className="text-xs text-green-600">Active</div>
      </div>
      
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-md p-2 text-center">
        <div className="flex justify-center mb-1">
          <XCircle className="w-4 h-4 text-gray-600" />
        </div>
        <div className="text-lg font-bold text-gray-800">{stats.notActive}</div>
        <div className="text-xs text-gray-600">Not Active</div>
      </div>
      
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-md p-2 text-center">
        <div className="flex justify-center mb-1">
          <Shield className="w-4 h-4 text-orange-600" />
        </div>
        <div className="text-lg font-bold text-orange-800">{stats.inMatches}</div>
        <div className="text-xs text-orange-600">In Matches</div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My Skill Listings</h1>
        <button
          onClick={() => setShowNewForm(true)}
          disabled={userSkills.length === 0}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
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
                <button 
                  onClick={onNavigateToSkills}
                  className="ml-1 font-medium underline hover:no-underline text-yellow-700 cursor-pointer"
                >
                  Add skills now
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {!loading && listings.length > 0 && renderStatsCards()}

      {/* Compact info banner about match protection */}
      {stats.inMatches > 0 && (
        <div className="mb-2 bg-orange-50 border border-orange-200 rounded px-3 py-2">
          <div className="flex items-center text-xs text-orange-700">
            <Shield className="w-3 h-3 text-orange-600 mr-2 flex-shrink-0" />
            <span>
              {stats.inMatches} listing{stats.inMatches > 1 ? 's' : ''} protected by active matches
            </span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {listings.length > 0 && (
        <div className="bg-white rounded-md shadow-sm border p-3 mb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Search - Full width on mobile */}
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded text-gray-900 placeholder-gray-500 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Use custom dropdowns for mobile responsiveness */}
            <div className="block sm:hidden">
              <CustomDropdown
                value={statusFilter}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'not active', label: 'Not Active' }
                ]}
                onChange={setStatusFilter}
                placeholder="All Statuses"
                isOpen={showStatusDropdown}
                setIsOpen={setShowStatusDropdown}
              />
            </div>

            <div className="block sm:hidden">
              <CustomDropdown
                value={categoryFilter}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...getUniqueCategories().map(category => ({ value: category, label: category }))
                ]}
                onChange={setCategoryFilter}
                placeholder="All Categories"
                isOpen={showCategoryDropdown}
                setIsOpen={setShowCategoryDropdown}
              />
            </div>

            {/* Desktop dropdowns */}
            <div className="hidden sm:block">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="not active">Not Active</option>
              </select>
            </div>

            <div className="hidden sm:block">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Compact Info Row */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
        <div>
          {listings.length > 0 && (
            <span>Showing {filteredListings.length} of {listings.length} listings</span>
          )}
        </div>
        <div>
          {stats.inMatches > 0 && (
            <div className="flex items-center bg-orange-50 border border-orange-200 rounded px-2 py-1">
              <Shield className="w-3 h-3 text-orange-600 mr-1" />
              <span className="text-orange-700">
                {stats.inMatches} protected by matches
              </span>
            </div>
          )}
        </div>
      </div>

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
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No listings yet</h3>
          <p className="text-gray-600 mb-6">Create your first skill listing to start connecting with other learners</p>
          {userSkills.length > 0 ? (
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Listing
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">First, add some skills to your profile:</p>
              <button
                onClick={onNavigateToSkills}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Add Skills First
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results State */}
      {!loading && listings.length > 0 && filteredListings.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No listings match your filters</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setCategoryFilter('all');
              closeAllDropdowns();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Clear Filters
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