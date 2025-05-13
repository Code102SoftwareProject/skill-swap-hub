'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SkillListing } from '@/types/skillListing';
import { BadgeCheck, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface ListingCardProps {
  listing: SkillListing;
  onDelete: (id: string) => void;
  onEdit: (listing: SkillListing) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onDelete, onEdit }) => {
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
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
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col h-[320px]">
        {/* Card Header - User Info */}
        <div className="p-4 border-b border-gray-200 flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-3 flex-shrink-0">
            <Image
              src={listing.userDetails.avatar || '/Avatar.png'}
              alt={`${listing.userDetails.firstName} ${listing.userDetails.lastName}`}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-800 flex items-center truncate">
              <span className="truncate">{listing.userDetails.firstName} {listing.userDetails.lastName}</span>
              <BadgeCheck className="w-5 h-5 ml-1 text-blue-500 flex-shrink-0" />
            </h3>
            <p className="text-xs text-gray-500 truncate">
              Posted on {formatDate(listing.createdAt)}
            </p>
          </div>
        </div>

        {/* Card Body with fixed height */}
        <div className="p-0 flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-0">
            {/* Offering Section */}
            <div className="bg-blue-50 p-4 h-40">
              <div className="text-green-600 font-medium mb-2">
                Offering
              </div>
              <div className="font-semibold text-gray-800 mb-2 line-clamp-1">
                {listing.offering.skillTitle}
              </div>
              <div className="flex items-center">
                <span className="text-blue-600 text-sm">
                  ❤ Level: {listing.offering.proficiencyLevel}
                </span>
              </div>
            </div>

            {/* Seeking Section */}
            <div className="bg-purple-50 p-4 h-40">
              <div className="text-purple-600 font-medium mb-2">
                Seeking
              </div>
              <div className="font-semibold text-gray-800 mb-2 line-clamp-1">
                {listing.seeking.skillTitle}
              </div>
              <div className="text-sm text-gray-600">
                {listing.seeking.categoryName}
              </div>
            </div>
          </div>
          
          {/* Bottom Controls Section - Contains View Details + Action Buttons */}
          <div className="flex items-center justify-between p-3 border-t border-gray-100">
            {/* View Details Button */}
            <button 
              onClick={() => setShowDetailsModal(true)}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded px-2 py-1"
            >
              <Eye className="w-4 h-4 mr-1" /> View Details
            </button>
            
            {/* Action Buttons */}
            {isOwner && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(listing)}
                  className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                  aria-label="Edit listing"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </button>
                <button
                  onClick={() => onDelete(listing.id)}
                  className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                  aria-label="Delete listing"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal Popup */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-800">Listing Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-3 flex-shrink-0">
                  <Image
                    src={listing.userDetails.avatar || '/Avatar.png'}
                    alt={`${listing.userDetails.firstName} ${listing.userDetails.lastName}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 flex items-center">
                    <span>{listing.userDetails.firstName} {listing.userDetails.lastName}</span>
                    <BadgeCheck className="w-5 h-5 ml-1 text-blue-500" />
                  </h3>
                  <p className="text-sm text-gray-500">
                    Posted on {formatDate(listing.createdAt)}
                  </p>
                </div>
              </div>

              {/* Skill Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Offering Section */}
                <div className="bg-blue-50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-600 mb-3">Offering</h3>
                  
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 mb-1">{listing.offering.skillTitle}</h4>
                    <p className="text-sm text-blue-600 mb-3">
                      Proficiency: {listing.offering.proficiencyLevel}
                    </p>
                    
                    {listing.offering.description && (
                      <div className="text-sm text-gray-700">
                        <p>{listing.offering.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seeking Section */}
                <div className="bg-purple-50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-600 mb-3">Seeking</h3>
                  
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 mb-1">{listing.seeking.skillTitle}</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Category: {listing.seeking.categoryName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 p-5 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Information</h3>
                
                {listing.additionalInfo.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700">{listing.additionalInfo.description}</p>
                  </div>
                )}
                
                {listing.additionalInfo.availability && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-1">Availability</h4>
                    <p className="text-sm text-gray-600">{listing.additionalInfo.availability}</p>
                  </div>
                )}
                
                {listing.additionalInfo.tags && Array.isArray(listing.additionalInfo.tags) && listing.additionalInfo.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {listing.additionalInfo.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer - Actions */}
              <div className="flex justify-end space-x-3">
                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        onEdit(listing);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <Edit className="w-4 h-4 inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        onDelete(listing.id);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" /> Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ListingCard;