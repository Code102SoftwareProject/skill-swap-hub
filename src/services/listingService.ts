// File: src/services/listingService.ts
import { 
  SkillListing, 
  ApiResponse, 
  NewListingData, 
  UpdateListingData
} from '@/types/skillListing';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

// Function to fetch all listings
export const getListings = async (type?: string): Promise<ApiResponse<SkillListing[]>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    let url = '/api/listings';
    if (type) {
      url += `?type=${type}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const apiResponse = await response.json();
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching listings:', error);
    return { success: false, message: 'Failed to fetch listings' };
  }
};

// Function to fetch a single listing
export const getListing = async (id: string): Promise<ApiResponse<SkillListing>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch(`/api/listings/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`Error fetching listing ${id}:`, error);
    return { success: false, message: 'Failed to fetch listing' };
  }
};

// Function to create a new listing
export const createListing = async (listingData: NewListingData): Promise<ApiResponse<SkillListing>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(listingData),
    });

    return await response.json();
  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, message: 'Failed to create listing' };
  }
};

// Function to update a listing
export const updateListing = async (id: string, updateData: UpdateListingData): Promise<ApiResponse<SkillListing>> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    console.log('Updating listing with data:', updateData);

    const response = await fetch(`/api/listings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, message: 'Listing updated successfully' };
    }

    const apiResponse = await response.json();
    console.log('Update response:', apiResponse);
    return apiResponse;
  } catch (error) {
    console.error(`Error updating listing ${id}:`, error);
    return { success: false, message: 'Failed to update listing' };
  }
};

// Function to delete a listing
export const deleteListing = async (id: string): Promise<ApiResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch(`/api/listings/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, message: 'Listing deleted successfully' };
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting listing ${id}:`, error);
    return { success: false, message: 'Failed to delete listing' };
  }
};

// NEW FUNCTION: Get listings used in matches (efficient batch check)
export const getListingsUsedInMatches = async (): Promise<ApiResponse<any>> => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return { success: false, message: 'Authentication required' };
    }

    const response = await fetch('/api/listings/used-in-matches', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching listings used in matches:', error);
    return { 
      success: false, 
      message: 'Failed to fetch listings used in matches' 
    };
  }
};