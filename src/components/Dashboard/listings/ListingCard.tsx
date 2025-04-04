'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SkillListing } from '@/types/skillListing';
import { BadgeCheck } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface ListingCardProps {
  listing: SkillListing;
  onDelete: (id: string) => void;
  onEdit: (listing: SkillListing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onDelete, onEdit }) => {
  const { user } = useAuth();
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Card Header - User Info */}
      <div className="p-4 border-b border-gray-200 flex items-center">
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
            <BadgeCheck className="w-5 h-5 ml-1 text-blue-500" />
          </h3>
          <p className="text-xs text-gray-500">
            Posted on {formatDate(listing.createdAt)}
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Offering Section */}
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="text-green-600 font-medium mb-2">
              Offering
            </div>
            <div className="font-semibold text-gray-800">
              {listing.offering.skillTitle}
            </div>
            <div className="flex items-center mt-2">
              <span className="text-blue-600 text-sm">❤ Proficiency Level: {listing.offering.proficiencyLevel}</span>
            </div>
            <div className="mt-4 text-sm">
              <p>• {listing.offering.description.length > 60 
                  ? `${listing.offering.description.substring(0, 60)}...` 
                  : listing.offering.description}</p>
              <p>• Available dates</p>
            </div>
          </div>

          {/* Seeking Section */}
          <div className="bg-gray-100 p-4 rounded-md">
            <div className="text-orange-500 font-medium mb-2">
              Seeking
            </div>
            <div className="font-semibold text-gray-800">
              {listing.seeking.skillTitle}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {listing.additionalInfo.description && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">
              {listing.additionalInfo.description}
            </p>
            
            {/* Availability */}
            {listing.additionalInfo.availability && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Available:</span> {listing.additionalInfo.availability}
              </p>
            )}
            
            {/* Tags */}
            {listing.additionalInfo.tags && Array.isArray(listing.additionalInfo.tags) && listing.additionalInfo.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
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
        )}
      </div>

      {/* Card Footer - Actions */}
      {isOwner && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
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
      )}
    </div>
  );
};

export default ListingCard;