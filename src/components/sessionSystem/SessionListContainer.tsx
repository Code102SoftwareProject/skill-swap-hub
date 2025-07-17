"use client";

import { Clock, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import SessionCard from './SessionCard';
import type { Session, CounterOffer, UserProfile } from '@/types';

interface SessionListContainerProps {
  sessions: Session[];
  userId: string;
  otherUser: UserProfile;
  counterOffers: { [sessionId: string]: CounterOffer[] };
  expandedSessions: Set<string>;
  showActiveCounterOffers: { [sessionId: string]: boolean };
  processingSession: string | null;
  showCancelledSessions: boolean;
  onToggleExpansion: (sessionId: string) => void;
  onToggleActiveCounterOffers: (sessionId: string) => void;
  onToggleCancelledSessions: () => void;
  onAcceptReject: (sessionId: string, action: 'accept' | 'reject') => void;
  onCounterOffer: (sessionId: string) => void;
  onEditSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRequestCompletion: (sessionId: string) => void;
  onCompletionResponse: (sessionId: string, action: 'approve' | 'reject', providedRejectionReason?: string) => void;
  onCounterOfferResponse: (counterOfferId: string, action: 'accept' | 'reject') => void;
  formatDate: (dateString: string) => string;
  getUserDisplayName: (user: UserProfile | null) => string;
  getCounterOfferUserName: (counterOfferedBy: any) => string;
  getSessionStatus: (session: Session) => string;
}

export default function SessionListContainer({
  sessions,
  userId,
  otherUser,
  counterOffers,
  expandedSessions,
  showActiveCounterOffers,
  processingSession,
  showCancelledSessions,
  onToggleExpansion,
  onToggleActiveCounterOffers,
  onToggleCancelledSessions,
  onAcceptReject,
  onCounterOffer,
  onEditSession,
  onDeleteSession,
  onRequestCompletion,
  onCompletionResponse,
  onCounterOfferResponse,
  formatDate,
  getUserDisplayName,
  getCounterOfferUserName,
  getSessionStatus
}: SessionListContainerProps) {
  
  // Group sessions by status for better organization
  const activeSessions = sessions.filter(session => {
    const status = getSessionStatus(session);
    return status !== 'canceled' && status !== 'rejected';
  });

  const pendingSessions = activeSessions.filter(session => getSessionStatus(session) === 'pending');
  const acceptedSessions = activeSessions.filter(session => getSessionStatus(session) === 'accepted');
  const completedSessions = activeSessions.filter(session => getSessionStatus(session) === 'completed');
  
  const cancelledRejectedSessions = sessions.filter(session => {
    const status = getSessionStatus(session);
    return status === 'canceled' || status === 'rejected';
  });

  return (
    <div className="space-y-6">
      {/* Pending Sessions */}
      {pendingSessions.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Requests ({pendingSessions.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                userId={userId}
                otherUser={otherUser}
                counterOffers={counterOffers}
                expandedSessions={expandedSessions}
                showActiveCounterOffers={showActiveCounterOffers}
                processingSession={processingSession}
                onToggleExpansion={onToggleExpansion}
                onToggleActiveCounterOffers={onToggleActiveCounterOffers}
                onAcceptReject={onAcceptReject}
                onCounterOffer={onCounterOffer}
                onEditSession={onEditSession}
                onDeleteSession={onDeleteSession}
                onRequestCompletion={onRequestCompletion}
                onCompletionResponse={onCompletionResponse}
                onCounterOfferResponse={onCounterOfferResponse}
                formatDate={formatDate}
                getUserDisplayName={getUserDisplayName}
                getCounterOfferUserName={getCounterOfferUserName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {acceptedSessions.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Active Sessions ({acceptedSessions.length})
            </h3>
          </div>
          <div className="space-y-3">
            {acceptedSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                userId={userId}
                otherUser={otherUser}
                counterOffers={counterOffers}
                expandedSessions={expandedSessions}
                showActiveCounterOffers={showActiveCounterOffers}
                processingSession={processingSession}
                onToggleExpansion={onToggleExpansion}
                onToggleActiveCounterOffers={onToggleActiveCounterOffers}
                onAcceptReject={onAcceptReject}
                onCounterOffer={onCounterOffer}
                onEditSession={onEditSession}
                onDeleteSession={onDeleteSession}
                onRequestCompletion={onRequestCompletion}
                onCompletionResponse={onCompletionResponse}
                onCounterOfferResponse={onCounterOfferResponse}
                formatDate={formatDate}
                getUserDisplayName={getUserDisplayName}
                getCounterOfferUserName={getCounterOfferUserName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Sessions */}
      {completedSessions.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Completed Sessions ({completedSessions.length})
            </h3>
          </div>
          <div className="space-y-3">
            {completedSessions.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                userId={userId}
                otherUser={otherUser}
                counterOffers={counterOffers}
                expandedSessions={expandedSessions}
                showActiveCounterOffers={showActiveCounterOffers}
                processingSession={processingSession}
                onToggleExpansion={onToggleExpansion}
                onToggleActiveCounterOffers={onToggleActiveCounterOffers}
                onAcceptReject={onAcceptReject}
                onCounterOffer={onCounterOffer}
                onEditSession={onEditSession}
                onDeleteSession={onDeleteSession}
                onRequestCompletion={onRequestCompletion}
                onCompletionResponse={onCompletionResponse}
                onCounterOfferResponse={onCounterOfferResponse}
                formatDate={formatDate}
                getUserDisplayName={getUserDisplayName}
                getCounterOfferUserName={getCounterOfferUserName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled/Rejected Sessions Section */}
      {cancelledRejectedSessions.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-6">
          <button
            onClick={onToggleCancelledSessions}
            className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Cancelled & Rejected Sessions ({cancelledRejectedSessions.length})
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
              showCancelledSessions ? 'rotate-180' : ''
            }`} />
          </button>

          {showCancelledSessions && (
            <div className="mt-3 space-y-3">
              {cancelledRejectedSessions.map((session) => {
                const status = getSessionStatus(session);
                
                return (
                  <div key={`cancelled-${session._id}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {/* Cancelled Session Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <XCircle className="h-3 w-3" />
                          <span className="capitalize">{status}</span>
                        </span>
                        {status === 'rejected' && session.rejectedBy && (
                          <span className="text-xs text-gray-600">
                            by {session.rejectedBy._id === userId ? 'you' : 
                            (typeof session.rejectedBy === 'object' && session.rejectedBy.firstName && session.rejectedBy.lastName 
                              ? `${session.rejectedBy.firstName} ${session.rejectedBy.lastName}`
                              : 'other user')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {status === 'rejected' && session.rejectedAt ? formatDate(session.rejectedAt) :
                         formatDate(session.createdAt || new Date().toISOString())}
                      </div>
                    </div>

                    {/* Session Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Start Date:</span> {formatDate(session.startDate)}
                      </div>
                      {session.expectedEndDate && (
                        <div>
                          <span className="font-medium">Expected End:</span> {formatDate(session.expectedEndDate)}
                        </div>
                      )}
                    </div>

                    {/* Session Skills Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="bg-white p-3 rounded border">
                        <div className="text-xs font-medium text-gray-600 mb-1">Offered:</div>
                        <div className="text-sm font-semibold text-blue-900">
                          {session.skill1Id?.skillTitle || session.skill1Id?.title || 'Skill not available'}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <div className="text-xs font-medium text-gray-600 mb-1">Requested:</div>
                        <div className="text-sm font-semibold text-green-900">
                          {session.skill2Id?.skillTitle || session.skill2Id?.title || 'Skill not available'}
                        </div>
                      </div>
                    </div>

                    {/* Cancellation/Rejection Reason if available */}
                    {session.completionRejectionReason && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                        <span className="font-medium">Reason:</span> {session.completionRejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
