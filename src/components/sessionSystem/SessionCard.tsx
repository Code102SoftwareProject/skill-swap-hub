'use client';

import { useState } from 'react';
import SessionCompletionControls from './SessionCompletionControls';
import SessionReviewModal from './SessionReviewModal';
import SessionReviewsDisplay from './SessionReviewsDisplay';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, Star } from 'lucide-react';

interface SessionCardProps {
  session: {
    _id: string;
    status: 'pending' | 'active' | 'completed' | 'canceled';
    user1Id: { _id: string; firstName: string; lastName: string };
    user2Id: { _id: string; firstName: string; lastName: string };
    skill1Id: { _id: string; skillTitle: string };
    skill2Id: { _id: string; skillTitle: string };
    descriptionOfService1: string;
    descriptionOfService2: string;
    startDate: string;
    createdAt: string;
    completionRequestedBy?: { _id: string; firstName: string; lastName: string };
    completionRequestedAt?: string;
    completionApprovedBy?: { _id: string; firstName: string; lastName: string };
    completionRejectedBy?: { _id: string; firstName: string; lastName: string };
    completionRejectionReason?: string;
    progress1?: any;
    progress2?: any;
  };
  currentUserId: string;
  onSessionUpdate: (updatedSession: any) => void;
  showReviews?: boolean;
  className?: string;
}

export default function SessionCard({ 
  session, 
  currentUserId, 
  onSessionUpdate, 
  showReviews = true,
  className = ''
}: SessionCardProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [localSession, setLocalSession] = useState(session);

  const isUser1 = session.user1Id._id === currentUserId;
  const otherUser = isUser1 ? session.user2Id : session.user1Id;
  const mySkill = isUser1 ? session.skill1Id : session.skill2Id;
  const otherSkill = isUser1 ? session.skill2Id : session.skill1Id;
  const myDescription = isUser1 ? session.descriptionOfService1 : session.descriptionOfService2;
  const otherDescription = isUser1 ? session.descriptionOfService2 : session.descriptionOfService1;

  const handleSessionUpdate = (updatedSession: any) => {
    setLocalSession(updatedSession);
    onSessionUpdate(updatedSession);
  };

  const handleReviewSubmitted = (review: any) => {
    console.log('Review submitted:', review);
    // Could trigger a refresh of reviews here
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'canceled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(localSession.status)} flex items-center space-x-1`}>
              {getStatusIcon(localSession.status)}
              <span className="capitalize">{localSession.status}</span>
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            Started: {formatDate(localSession.startDate)}
          </div>
        </div>

        {/* Session Partner */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Session with {otherUser.firstName} {otherUser.lastName}
          </h3>
          <div className="text-sm text-gray-600">
            Created: {formatDate(localSession.createdAt)}
          </div>
        </div>

        {/* Skills Exchange */}
        <div className="space-y-4 mb-4">
          {/* What I'm Teaching */}
          <div className="border-l-4 border-blue-400 pl-4">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-blue-600">You're teaching:</span>
              <span className="text-sm font-semibold">{mySkill.skillTitle}</span>
            </div>
            <p className="text-sm text-gray-700">{myDescription}</p>
          </div>

          {/* What I'm Learning */}
          <div className="border-l-4 border-green-400 pl-4">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-green-600">You're learning:</span>
              <span className="text-sm font-semibold">{otherSkill.skillTitle}</span>
            </div>
            <p className="text-sm text-gray-700">{otherDescription}</p>
          </div>
        </div>

        {/* Session Progress (if active) */}
        {localSession.status === 'active' && localSession.progress1 && localSession.progress2 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              Session is active - Progress tracking enabled
            </div>
          </div>
        )}

        {/* Completion Controls */}
        <SessionCompletionControls
          session={localSession}
          currentUserId={currentUserId}
          onSessionUpdate={handleSessionUpdate}
        />

        {/* Reviews Section */}
        {showReviews && localSession.status === 'completed' && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Session Reviews</h4>
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Star className="w-4 h-4" />
                <span>Leave Review</span>
              </button>
            </div>
            
            <SessionReviewsDisplay 
              sessionId={localSession._id}
              className="max-h-96 overflow-y-auto"
            />
          </div>
        )}
      </div>

      {/* Review Modal */}
      <SessionReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        session={localSession}
        currentUserId={currentUserId}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
