"use client";

import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  User, 
  BookOpen, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Session, CounterOffer, UserProfile } from '@/types';

interface SessionCardProps {
  session: Session;
  userId: string;
  otherUser: UserProfile | null;
  counterOffers: { [sessionId: string]: CounterOffer[] };
  expandedSessions: Set<string>;
  showActiveCounterOffers: { [sessionId: string]: boolean };
  processingSession: string | null;
  onToggleExpansion: (sessionId: string) => void;
  onToggleActiveCounterOffers: (sessionId: string) => void;
  onAcceptReject: (sessionId: string, action: 'accept' | 'reject') => void;
  onCounterOffer: (sessionId: string) => void;
  onEditSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRequestCompletion: (sessionId: string) => void;
  onCompletionResponse: (sessionId: string, action: 'approve' | 'reject') => void;
  onCounterOfferResponse: (counterOfferId: string, action: 'accept' | 'reject') => void;
  formatDate: (dateString: string) => string;
  getUserDisplayName: (user: UserProfile | null) => string;
  getCounterOfferUserName: (counterOfferedBy: any) => string;
}

export default function SessionCard({
  session,
  userId,
  otherUser,
  counterOffers,
  expandedSessions,
  showActiveCounterOffers,
  processingSession,
  onToggleExpansion,
  onToggleActiveCounterOffers,
  onAcceptReject,
  onCounterOffer,
  onEditSession,
  onDeleteSession,
  onRequestCompletion,
  onCompletionResponse,
  onCounterOfferResponse,
  formatDate,
  getUserDisplayName,
  getCounterOfferUserName
}: SessionCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Helper functions
  const getSessionStatus = (session: Session) => {
    if (session.status === 'completed') return 'completed';
    if (session.status === 'canceled') return 'canceled';
    if (session.status === 'rejected') return 'rejected';
    if (session.status === 'active') return 'accepted';
    if (session.status === 'pending') return 'pending';
    
    // Legacy fallback based on isAccepted field
    if (session.isAccepted === null) return 'pending';
    if (session.isAccepted === true) return 'accepted';
    if (session.isAccepted === false) return 'rejected';
    
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-blue-600 bg-blue-50 border border-blue-200';
      case 'canceled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'canceled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isCurrentUserReceiver = (session: Session) => {
    return session.user2Id._id === userId;
  };

  const isCurrentUserCreator = (session: Session) => {
    return session.user1Id._id === userId;
  };

  const canRespond = (session: Session) => {
    return isCurrentUserReceiver(session) && session.isAccepted === null;
  };

  const canEditOrDelete = (session: Session) => {
    return isCurrentUserCreator(session) && session.isAccepted === null;
  };

  const getPendingCounterOffersCount = (sessionId: string) => {
    const sessionCounterOffers = counterOffers[sessionId] || [];
    return sessionCounterOffers.filter(co => co.status === 'pending').length;
  };

  const getActiveCounterOffersCount = (sessionId: string) => {
    const sessionCounterOffers = counterOffers[sessionId] || [];
    return sessionCounterOffers.filter(co => co.status === 'accepted').length;
  };

  const renderCounterOffer = (counterOffer: CounterOffer) => {
    return (
      <div key={counterOffer._id} className={`border rounded-lg p-4 ${
        counterOffer.status === 'pending' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              counterOffer.status === 'pending' ? 'text-orange-900' : 'text-green-900'
            }`}>
              Counter offer by {getCounterOfferUserName(counterOffer.counterOfferedBy)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              counterOffer.status === 'pending' 
                ? 'bg-orange-200 text-orange-800' 
                : 'bg-green-200 text-green-800'
            }`}>
              {counterOffer.status}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(counterOffer.createdAt)}
          </div>
        </div>
        
        <p className={`text-sm mb-3 italic ${
          counterOffer.status === 'pending' ? 'text-orange-800' : 'text-green-800'
        }`}>
          "{counterOffer.counterOfferMessage}"
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="bg-white p-3 rounded border">
            <div className="text-xs font-medium text-gray-600 mb-1">Offered Skill:</div>
            <div className="text-sm font-semibold text-blue-900">
              {counterOffer.skill1Id?.skillTitle || counterOffer.skill1Id?.skillName || 'Skill not available'}
            </div>
            <div className="text-xs text-gray-600 mt-1">{counterOffer.descriptionOfService1}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-xs font-medium text-gray-600 mb-1">Requested Skill:</div>
            <div className="text-sm font-semibold text-green-900">
              {counterOffer.skill2Id?.skillTitle || counterOffer.skill2Id?.skillName || 'Skill not available'}
            </div>
            <div className="text-xs text-gray-600 mt-1">{counterOffer.descriptionOfService2}</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 mb-3">
          <div>Proposed date: {formatDate(counterOffer.startDate)}</div>
          {counterOffer.expectedEndDate && (
            <div>Expected end: {formatDate(counterOffer.expectedEndDate)}</div>
          )}
        </div>
        
        {/* Counter Offer Actions */}
        {counterOffer.status === 'pending' && counterOffer.counterOfferedBy._id !== userId && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onCounterOfferResponse(counterOffer._id, 'accept')}
              disabled={processingSession === counterOffer._id}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              Accept Counter Offer
            </button>
            <button
              onClick={() => onCounterOfferResponse(counterOffer._id, 'reject')}
              disabled={processingSession === counterOffer._id}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              Reject Counter Offer
            </button>
          </div>
        )}
        
        {counterOffer.status === 'pending' && counterOffer.counterOfferedBy._id === userId && (
          <div className="text-sm text-orange-700">
            Waiting for response...
          </div>
        )}
      </div>
    );
  };

  // Main component logic
  const status = getSessionStatus(session);
  const isReceiver = isCurrentUserReceiver(session);
  const isExpanded = expandedSessions.has(session._id);
  const pendingCounterOffers = getPendingCounterOffersCount(session._id);
  const activeCounterOffers = getActiveCounterOffersCount(session._id);
  const hasCounterOffers = counterOffers[session._id] && counterOffers[session._id].length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Session Header - Always Visible */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="capitalize">{status === 'completed' ? 'Completed' : status}</span>
            </span>
            
            {/* Status Indicators */}
            {isReceiver && status === 'pending' && (
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                Request for you
              </span>
            )}
            {isCurrentUserCreator(session) && status === 'pending' && (
              <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full border border-purple-200">
                Your request
              </span>
            )}
            
            {/* Counter Offer Indicators */}
            {pendingCounterOffers > 0 && (
              <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full border border-orange-200 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>{pendingCounterOffers} pending counter{pendingCounterOffers > 1 ? 's' : ''}</span>
              </span>
            )}
            
            {activeCounterOffers > 0 && status === 'accepted' && (
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
                {activeCounterOffers} active counter{activeCounterOffers > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <button
            onClick={() => onToggleExpansion(session._id)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="text-xs text-gray-500">
              {formatDate(session.startDate)}
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
        
        {/* Compact Skills Preview */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-900">
              {session.skill1Id?.skillTitle || session.skill1Id?.skillName || 'Skill Not Found'}
            </span>
            <span className="text-gray-500">by</span>
            <span className="text-gray-700">
              {session.user1Id._id === userId ? 'You' : 
                (session.user1Id.firstName && session.user1Id.lastName ? 
                  `${session.user1Id.firstName} ${session.user1Id.lastName}` : 
                  session.user1Id.name || 'Unknown User')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-900">
              {session.skill2Id?.skillTitle || session.skill2Id?.skillName || 'Skill Not Found'}
            </span>
            <span className="text-gray-500">by</span>
            <span className="text-gray-700">
              {session.user2Id._id === userId ? 'You' : 
                (session.user2Id.firstName && session.user2Id.lastName ? 
                  `${session.user2Id.firstName} ${session.user2Id.lastName}` : 
                  session.user2Id.name || 'Unknown User')}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Detailed Skills Information */}
          <div className="space-y-4">
            {/* What they offer */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium text-gray-900">
                  {session.user1Id._id === userId ? 'You offer:' : 
                    `${session.user1Id.firstName && session.user1Id.lastName ? 
                      `${session.user1Id.firstName} ${session.user1Id.lastName}` : 
                      session.user1Id.name || 'Unknown User'} offers:`}
                </h4>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-blue-900 text-lg">
                    {session.skill1Id?.skillTitle || session.skill1Id?.skillName || 'Skill Not Found'}
                  </h5>
                  {session.skill1Id?.proficiencyLevel && (
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                      {session.skill1Id.proficiencyLevel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  <span className="font-medium">Description:</span> {session.descriptionOfService1}
                </p>
              </div>
            </div>

            {/* What they want */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-gray-900">
                  {session.user2Id._id === userId ? 'You provide:' : 
                    `${session.user2Id.firstName && session.user2Id.lastName ? 
                      `${session.user2Id.firstName} ${session.user2Id.lastName}` : 
                      session.user2Id.name || 'Unknown User'} provides:`}
                </h4>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-green-900 text-lg">
                    {session.skill2Id?.skillTitle || session.skill2Id?.skillName || 'Skill Not Found'}
                  </h5>
                  {session.skill2Id?.proficiencyLevel && (
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      {session.skill2Id.proficiencyLevel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-green-700 mt-2">
                  <span className="font-medium">Description:</span> {session.descriptionOfService2}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
            {/* Show only View button for completed sessions */}
            {status === 'completed' ? (
              <button
                onClick={() => router.push(`/session/${session._id}?userId=${userId}`)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View Completed Session</span>
              </button>
            ) : (
              <>
                {/* Buttons for Session Receiver */}
                {canRespond(session) && (
                  <>
                    <button
                      onClick={() => onAcceptReject(session._id, 'accept')}
                      disabled={processingSession === session._id}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => onCounterOffer(session._id)}
                      disabled={processingSession === session._id}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Counter Offer</span>
                    </button>
                    <button
                      onClick={() => onAcceptReject(session._id, 'reject')}
                      disabled={processingSession === session._id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {/* Buttons for Session Creator */}
                {canEditOrDelete(session) && (
                  <>
                    <button
                      onClick={() => onEditSession(session._id)}
                      disabled={processingSession === session._id}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteSession(session._id)}
                      disabled={processingSession === session._id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                {/* View Button for Active Sessions */}
                {session.isAccepted === true && (
                  <button
                    onClick={async () => {
                      if (isNavigating) return; // Prevent multiple clicks
                      
                      try {
                        setIsNavigating(true);
                        console.log(`Navigating to session: ${session._id}`);
                        await router.push(`/session/${session._id}?userId=${userId}`);
                      } catch (error) {
                        console.error('Error navigating to session:', error);
                        setIsNavigating(false);
                      }
                    }}
                    disabled={isNavigating}
                    className={`${
                      isNavigating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : ''
                    } text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50`}
                    style={{
                      backgroundColor: isNavigating ? undefined : 'var(--primary)',
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span>{isNavigating ? 'Loading...' : 'View Session'}</span>
                  </button>
                )}

                {/* Session Completion Buttons */}
                {session.isAccepted === true && session.status !== 'completed' && (
                  <>
                    {session.completionRequestedBy ? (
                      <>
                        {(session.completionRequestedBy._id === userId || session.completionRequestedBy === userId) ? (
                          <span className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                            Completion requested - waiting for approval
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onCompletionResponse(session._id, 'approve')}
                              disabled={processingSession === session._id}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Approve Completion</span>
                            </button>
                            <button
                              onClick={() => onCompletionResponse(session._id, 'reject')}
                              disabled={processingSession === session._id}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </>
                    ) : session.completionRejectedBy ? (
                      <button
                        onClick={() => onRequestCompletion(session._id)}
                        disabled={processingSession === session._id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Request Completion Again</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onRequestCompletion(session._id)}
                        disabled={processingSession === session._id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Request Completion</span>
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Session Progress Info for Active/Completed Sessions */}
          {session.isAccepted === true && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              {session.status === 'completed' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-semibold text-green-800">
                      Session Successfully Completed! 🎉
                    </p>
                  </div>
                  <p className="text-xs text-green-700">
                    Both participants have completed their skill exchange. You can view the session details, submitted work, and reviews.
                  </p>
                </div>
              ) : session.completionRequestedBy ? (
                <div className="space-y-2">
                  <p className="text-sm text-blue-600">
                    🔄 Completion request pending approval
                  </p>
                  {session.completionRequestedBy._id === userId || session.completionRequestedBy === userId ? (
                    <p className="text-xs text-gray-600">
                      You requested completion on {formatDate(session.completionRequestedAt || '')}. Waiting for {getUserDisplayName(otherUser)} to approve.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600">
                      {getUserDisplayName(otherUser)} requested completion on {formatDate(session.completionRequestedAt || '')}. Please review above.
                    </p>
                  )}
                </div>
              ) : session.completionRejectedBy ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">
                    ❌ Completion request was declined
                  </p>
                  <p className="text-xs text-gray-600">
                    Declined on {formatDate(session.completionRejectedAt || '')}.
                  </p>
                  {session.completionRejectionReason && (
                    <div className="text-xs bg-red-50 border border-red-200 rounded p-2">
                      <span className="font-medium text-red-800">Reason:</span> {session.completionRejectionReason}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  🎉 Session accepted! Progress tracking has been created for both participants.
                </p>
              )}
            </div>
          )}

          {/* Counter Offers Section */}
          {hasCounterOffers && (
            <div className="space-y-3">
              {/* Pending Counter Offers */}
              {counterOffers[session._id].filter(co => co.status === 'pending').length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span>Pending Counter Offers ({counterOffers[session._id].filter(co => co.status === 'pending').length})</span>
                  </h4>
                  <div className="space-y-3">
                    {counterOffers[session._id].filter(co => co.status === 'pending').map((counterOffer) => renderCounterOffer(counterOffer))}
                  </div>
                </div>
              )}

              {/* Active Counter Offers - Collapsible */}
              {activeCounterOffers > 0 && (
                <div>
                  <button
                    onClick={() => onToggleActiveCounterOffers(session._id)}
                    className="flex items-center justify-between w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Accepted Counter Offers ({activeCounterOffers})
                      </span>
                    </div>
                    {showActiveCounterOffers[session._id] ? 
                      <ChevronDown className="h-4 w-4 text-green-600" /> : 
                      <ChevronRight className="h-4 w-4 text-green-600" />
                    }
                  </button>

                  {showActiveCounterOffers[session._id] && (
                    <div className="mt-3 space-y-3">
                      {counterOffers[session._id].filter(co => co.status === 'accepted').map((counterOffer) => renderCounterOffer(counterOffer))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
