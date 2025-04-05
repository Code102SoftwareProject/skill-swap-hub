'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SkillListing } from '@/types/skillListing';
import { BadgeCheck, MessageCircle, Calendar, Tag, Award } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface ListingCardProps {
  listing: SkillListing;
  onDelete: (id: string) => void;
  onEdit: (listing: SkillListing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onDelete, onEdit }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  
  useEffect(() => {
    // Check if the current user is the owner of this listing
    if (user && listing) {
      setIsOwner(user._id === listing.userId);
    }
  }, [user, listing]);
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

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

  // No separate details page as requested

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      {/* Card Header - User Info & Status */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-3">
            <Image
              src={listing.userDetails.avatar || '/Avatar.png'}
              alt={`${listing.userDetails.firstName} ${listing.userDetails.lastName}`}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 flex items-center">
              {listing.userDetails.firstName} {listing.userDetails.lastName}
              <BadgeCheck className="w-4 h-4 ml-1 text-blue-500" />
            </h3>
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{formatDate(listing.createdAt)}</span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Offering Section */}
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="text-blue-700 font-medium mb-2 flex items-center">
              <Award className="w-4 h-4 mr-1" />
              <span>OFFERING</span>
            </div>
            <div className="font-semibold text-gray-800 text-lg mb-1">
              {listing.offering.skillTitle}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {listing.offering.categoryName}
            </div>
            <div className="flex items-center mb-3">
              <span className={`px-2 py-1 text-xs rounded-full ${getProficiencyColor(listing.offering.proficiencyLevel)}`}>
                {listing.offering.proficiencyLevel}
              </span>
            </div>
            <div className="text-sm text-gray-700 line-clamp-2">
              {listing.offering.description}
            </div>
          </div>

          {/* Seeking Section */}
          <div className="bg-purple-50 p-4 rounded-md">
            <div className="text-purple-700 font-medium mb-2 flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>SEEKING</span>
            </div>
            <div className="font-semibold text-gray-800 text-lg mb-1">
              {listing.seeking.skillTitle}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {listing.seeking.categoryName}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-700 line-clamp-2 mb-2">
            {listing.additionalInfo.description}
          </div>
          
          {/* Availability */}
          {listing.additionalInfo.availability && (
            <div className="flex items-center text-xs text-gray-600 mb-2">
              <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
              <span>{listing.additionalInfo.availability}</span>
            </div>
          )}
          
          {/* Tags */}
          {listing.additionalInfo.tags && Array.isArray(listing.additionalInfo.tags) && listing.additionalInfo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <Tag className="w-3 h-3 text-gray-500 mr-1" />
              {listing.additionalInfo.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer - Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
        {isOwner ? (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(listing)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(listing.id)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push(`/dashboard/messages/create?listingId=${listing.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Contact
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingCard;