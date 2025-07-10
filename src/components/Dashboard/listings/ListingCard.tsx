// File: src/components/Dashboard/listings/ListingCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SkillListing } from '@/types/skillListing';
import { BadgeCheck, Edit, Trash2, Eye, Users, Shield, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface ListingCardProps {
  listing: SkillListing & { 
    isUsedInMatches?: boolean; 
    matchDetails?: any[] 
  };
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

  // Get status display configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle, 
          text: 'Active' 
        };
      case 'not active':
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: XCircle, 
          text: 'Not Active' 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: Clock, 
          text: 'Unknown' 
        };
    }
  };

  const statusConfig = getStatusConfig(listing.status);
  const StatusIcon = statusConfig.icon;
  const canModify = isOwner && !listing.isUsedInMatches;

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[320px] transition-shadow hover:shadow-md`}>
        {/* Card Header - User Info & Status */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-3 flex-shrink-0">
                <Image
                  src={'/Avatar.png'}
                  alt={`${listing.userDetails.firstName} ${listing.userDetails.lastName}`}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 flex items-center truncate">
                  <span className="truncate">{listing.userDetails.firstName} {listing.userDetails.lastName}</span>
                  <BadgeCheck className="w-4 h-4 ml-1 text-blue-500 flex-shrink-0" />
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {formatDate(listing.createdAt)}
                </p>
              </div>
            </div>
            
            {/* Status Badge Only */}
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusConfig.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.text}
              </span>
            </div>
          </div>
          
          {/* Match Protection Badge - Only if in matches */}
          {listing.isUsedInMatches && (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                <Shield className="w-3 h-3 mr-1" />
                Protected by active matches
              </span>
            </div>
          )}
        </div>

        {/* Card Body - Skills */}
        <div className="flex-1 flex">
          {/* Offering Section */}
          <div className="flex-1 bg-blue-50 p-4 border-r border-gray-100">
            <div className="mb-2">
              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Offering</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
              {listing.offering.skillTitle}
            </h4>
            <div className="space-y-1">
              <p className="text-xs text-blue-600">
                Level: {listing.offering.proficiencyLevel}
              </p>
              <p className="text-xs text-gray-600 line-clamp-1">
                {listing.offering.categoryName}
              </p>
            </div>
          </div>

          {/* Seeking Section */}
          <div className="flex-1 bg-purple-50 p-4">
            <div className="mb-2">
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Seeking</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
              {listing.seeking.skillTitle}
            </h4>
            <div className="space-y-1">
              <p className="text-xs text-gray-600 line-clamp-1">
                {listing.seeking.categoryName}
              </p>
            </div>
          </div>
        </div>
        
        {/* Card Footer - Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* View Details Button */}
            <button 
              onClick={() => setShowDetailsModal(true)}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              <Eye className="w-4 h-4 mr-1" /> 
              View Details
            </button>
            
            {/* Action Buttons - Only show if can modify */}
            {isOwner && canModify && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(listing)}
                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  title="Edit listing"
                >
                  <Edit className="w-3 h-3 mr-1" /> 
                  Edit
                </button>
                <button
                  onClick={() => onDelete(listing.id)}
                  className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  title="Delete listing"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> 
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal - Simplified */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">Listing Details</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-4">
                  <Image
                    src={'/Avatar.png'}
                    alt={`${listing.userDetails.firstName} ${listing.userDetails.lastName}`}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    {listing.userDetails.firstName} {listing.userDetails.lastName}
                    <BadgeCheck className="w-5 h-5 ml-2 text-blue-500" />
                  </h3>
                  <p className="text-sm text-gray-500">
                    Posted on {formatDate(listing.createdAt)}
                  </p>
                </div>
                
                {/* Status Badge */}
                <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${statusConfig.color}`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {statusConfig.text}
                </span>
              </div>

              {/* Match Protection Alert */}
              {listing.isUsedInMatches && listing.matchDetails && listing.matchDetails.length > 0 && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-orange-800 mb-1">
                        Active Match Protection
                      </h4>
                      <p className="text-sm text-orange-700 mb-3">
                        This listing is involved in {listing.matchDetails.length} active skill match{listing.matchDetails.length > 1 ? 'es' : ''} and cannot be modified.
                      </p>
                      <div className="space-y-1">
                        {listing.matchDetails.slice(0, 3).map((match: any, index: number) => (
                          <div key={index} className="text-xs text-orange-600 flex items-center">
                            <div className="w-1 h-1 bg-orange-400 rounded-full mr-2"></div>
                            {match.matchType === 'exact' ? '💯' : '🔀'} {match.matchType} match ({match.status})
                          </div>
                        ))}
                        {listing.matchDetails.length > 3 && (
                          <div className="text-xs text-orange-600">
                            +{listing.matchDetails.length - 3} more matches
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Offering */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                  <h4 className="text-green-700 font-semibold mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Offering
                  </h4>
                  <h5 className="font-bold text-gray-900 mb-2">{listing.offering.skillTitle}</h5>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-700 font-medium">Level:</span> <span className="text-gray-800">{listing.offering.proficiencyLevel}</span></p>
                    <p><span className="text-gray-700 font-medium">Category:</span> <span className="text-gray-800">{listing.offering.categoryName}</span></p>
                    {listing.offering.description && (
                      <p className="text-gray-700 mt-3 leading-relaxed">{listing.offering.description}</p>
                    )}
                  </div>
                </div>

                {/* Seeking */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
                  <h4 className="text-purple-700 font-semibold mb-3 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Seeking
                  </h4>
                  <h5 className="font-bold text-gray-900 mb-2">{listing.seeking.skillTitle}</h5>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-700 font-medium">Category:</span> <span className="text-gray-800">{listing.seeking.categoryName}</span></p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(listing.additionalInfo.description || listing.additionalInfo.availability || (listing.additionalInfo.tags && Array.isArray(listing.additionalInfo.tags) && listing.additionalInfo.tags.length > 0)) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                  
                  {listing.additionalInfo.description && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Description:</h5>
                      <p className="text-sm text-gray-800 leading-relaxed">{listing.additionalInfo.description}</p>
                    </div>
                  )}
                  
                  {listing.additionalInfo.availability && (
                    <div className="mb-4">
                      <p className="text-sm"><span className="font-medium text-gray-700">Availability:</span> <span className="text-gray-800">{listing.additionalInfo.availability}</span></p>
                    </div>
                  )}
                  
                  {listing.additionalInfo.tags && Array.isArray(listing.additionalInfo.tags) && listing.additionalInfo.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {listing.additionalInfo.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="bg-white border border-gray-300 text-gray-800 text-xs px-3 py-1 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                {isOwner && canModify && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        onEdit(listing);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" /> 
                      Edit Listing
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        onDelete(listing.id);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> 
                      Delete Listing
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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