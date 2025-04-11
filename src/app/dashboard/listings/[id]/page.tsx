'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';
import { getListing } from '@/lib/services/listingService';
import { SkillListing } from '@/types/skillListing';

interface ListingDetailsPageProps {
  params: {
    id: string;
  };
}

const ListingDetailsPage: React.FC<ListingDetailsPageProps> = ({ params }) => {
  const { id } = params;
  const router = useRouter();
  const { showToast } = useToast();
  
  const [listing, setListing] = useState<SkillListing | null>(null);
  const [loading, setLoading] = useState(true);

  // Format date helper
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Fetch listing on component mount
  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const response = await getListing(id);
        
        if (response.success && response.data) {
          setListing(response.data);
        } else {
          showToast(response.message || 'Failed to load listing', 'error');
          router.push('/dashboard/listings');
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        showToast('Error loading listing', 'error');
        router.push('/dashboard/listings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [id, router, showToast]);

  // Function to determine proficiency level badge color
  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'bg-blue-100 text-blue-800';
      case 'Intermediate':
        return 'bg-green-100 text-green-800';
      case 'Beginner':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'matched':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Listing Not Found</h1>
        <p className="text-gray-600">The listing you are looking for could not be found.</p>
        <button
          onClick={() => router.push('/dashboard/listings')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Listing Details</h1>
        <button
          onClick={() => router.push('/dashboard/listings')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Listings
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-4">
                <Image
                  src={listing.userDetails.avatar || '/Avatar.png'}
                  alt={`${listing.userDetails.firstName} ${listing.userDetails.lastName}`}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  {listing.userDetails.firstName} {listing.userDetails.lastName}
                  <BadgeCheck className="w-5 h-5 ml-1 text-blue-500" />
                </h2>
                <p className="text-sm text-gray-500">
                  Posted on {formatDate(listing.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(listing.status)}`}>
                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
              </span>
              
              <button
                onClick={() => router.push(`/dashboard/messages/create?listingId=${listing.id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Offering Section */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Offering</h3>
              <div className="mb-4">
                <h4 className="text-xl font-bold text-gray-800">{listing.offering.skillTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">Category: {listing.offering.categoryName}</p>
              </div>
              
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getProficiencyColor(listing.offering.proficiencyLevel)}`}>
                  {listing.offering.proficiencyLevel}
                </span>
              </div>
              
              <div className="mt-4 bg-white p-4 rounded-md">
                <p className="text-gray-700">{listing.offering.description}</p>
              </div>
            </div>
            
            {/* Seeking Section */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">Seeking</h3>
              <div className="mb-4">
                <h4 className="text-xl font-bold text-gray-800">{listing.seeking.skillTitle}</h4>
                <p className="text-sm text-gray-600 mt-1">Category: {listing.seeking.categoryName}</p>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">{listing.additionalInfo.description}</p>
              
              {/* Availability */}
              {listing.additionalInfo.availability && (
                <div className="mb-4">
                  <span className="text-sm font-semibold text-gray-700">Availability:</span>
                  <span className="text-sm text-gray-600 ml-2">{listing.additionalInfo.availability}</span>
                </div>
              )}
              
              {/* Tags */}
              {listing.additionalInfo.tags && Array.isArray(listing.additionalInfo.tags) && listing.additionalInfo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {listing.additionalInfo.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsPage;