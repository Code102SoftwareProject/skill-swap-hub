'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { getListings, deleteListing } from '@/services/listingService';
import { SkillListing } from '@/types/skillListing';
import ListingCard from '@/components/Dashboard/listings/ListingCard';
import NewListingForm from '@/components/Dashboard/listings/NewListingForm';
import EditListingForm from '@/components/Dashboard/listings/EditListingForm';
import ConfirmationModal from '@/components/Dashboard/listings/ConfirmationModal';

const ListingsPage = () => {
  const { showToast } = useToast();
  const [listings, setListings] = useState<SkillListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewListingForm, setShowNewListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState<SkillListing | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'other'>('all');
  
  // Delete confirmation state
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Fetch listings on component mount and when filter changes
  useEffect(() => {
    fetchListings();
  }, [activeFilter]);

  // Function to fetch listings based on filter
  const fetchListings = async () => {
    setLoading(true);
    try {
      const queryType = activeFilter === 'all' ? undefined : activeFilter;
      const response = await getListings(queryType);
      
      if (response.success && response.data) {
        setListings(response.data);
      } else {
        showToast(response.message || 'Failed to load listings', 'error');
      }
    } catch (error) {
      console.error('Error in fetchListings:', error);
      showToast('Error loading listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening delete confirmation
  const confirmDelete = (listingId: string) => {
    const listingToDelete = listings.find(listing => listing.id === listingId);
    
    if (!listingToDelete) {
      showToast('Listing not found', 'error');
      return;
    }
    
    setDeletingListingId(listingId);
    setShowDeleteConfirmation(true);
  };

  // Handle actual deletion after confirmation
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
        fetchListings();
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

  // Handle form submission success
  const handleFormSuccess = () => {
    fetchListings();
    setShowNewListingForm(false);
    setEditingListing(null);
  };

  // Handle edit button click
  const handleEditListing = (listing: SkillListing) => {
    setEditingListing(listing);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Skill Listings</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Filter buttons */}
          <div className="flex rounded-md overflow-hidden border border-gray-300 shadow-sm">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 text-sm font-medium ${
                activeFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              All Listings
            </button>
            <button
              onClick={() => setActiveFilter('mine')}
              className={`px-4 py-2 text-sm font-medium ${
                activeFilter === 'mine' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              My Listings
            </button>
            <button
              onClick={() => setActiveFilter('other')}
              className={`px-4 py-2 text-sm font-medium ${
                activeFilter === 'other' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              Other Users
            </button>
          </div>
          
          {/* Add New Listing button */}
          <button
            onClick={() => setShowNewListingForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors shadow-sm font-medium"
          >
            Add New Listing
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No listings found</h3>
          <p className="text-gray-500 mb-4">
            {activeFilter === 'mine' 
              ? "You haven't created any listings yet" 
              : activeFilter === 'other'
                ? "There are no listings from other users"
                : "There are no active listings in the system"
            }
          </p>
          {activeFilter === 'mine' && (
            <button
              onClick={() => setShowNewListingForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              Create Your First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {listings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing}
              onDelete={confirmDelete}
              onEdit={handleEditListing}
            />
          ))}
        </div>
      )}

      {/* New Listing Form Modal */}
      {showNewListingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Create New Listing</h2>
                <button 
                  onClick={() => setShowNewListingForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl focus:outline-none"
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>
              <NewListingForm 
                onSuccess={handleFormSuccess} 
                onCancel={() => setShowNewListingForm(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Form Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Edit Listing</h2>
                <button 
                  onClick={() => setEditingListing(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl focus:outline-none"
                  aria-label="Close modal"
                >
                  &times;
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

export default ListingsPage;