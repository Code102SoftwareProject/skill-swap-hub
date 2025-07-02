"use client";

import { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, XCircle, Edit, Calendar, User, BookOpen, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CreateSessionModal from '@/components/sessionSystem/CreateSessionModal';
import EditSessionModal from '@/components/sessionSystem/EditSessionModal';
import CounterOfferModal from '@/components/sessionSystem/CounterOfferModal';

interface Session {
  _id: string;
  user1Id: any;
  user2Id: any;
  skill1Id: any;
  skill2Id: any;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  isAccepted: boolean | null;
  isAmmended: boolean;
  status: string;
  createdAt: string;
  progress1?: any;
  progress2?: any;
}

interface CounterOffer {
  _id: string;
  originalSessionId: string;
  counterOfferedBy: any;
  skill1Id: any;
  skill2Id: any;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  counterOfferMessage: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface SessionBoxProps {
  chatRoomId: string;
  userId: string;
  otherUserId: string;
  otherUserName: string;
}

export default function SessionBox({ chatRoomId, userId, otherUserId, otherUserName }: SessionBoxProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [counterOffers, setCounterOffers] = useState<{ [sessionId: string]: CounterOffer[] }>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [sessionToCounterOffer, setSessionToCounterOffer] = useState<Session | null>(null);
  const [processingSession, setProcessingSession] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/session/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        // Filter sessions that involve the other user in this chat
        const filteredSessions = data.sessions.filter((session: Session) => 
          (session.user1Id._id === userId && session.user2Id._id === otherUserId) ||
          (session.user1Id._id === otherUserId && session.user2Id._id === userId)
        );
        setSessions(filteredSessions);
        
        // Fetch counter offers for each session
        await fetchCounterOffers(filteredSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounterOffers = async (sessionList: Session[]) => {
    try {
      const counterOfferPromises = sessionList.map(async (session) => {
        const response = await fetch(`/api/session/counter-offer?sessionId=${session._id}`);
        const data = await response.json();
        return { sessionId: session._id, counterOffers: data.success ? data.counterOffers : [] };
      });

      const results = await Promise.all(counterOfferPromises);
      const counterOfferMap: { [sessionId: string]: CounterOffer[] } = {};
      
      results.forEach(({ sessionId, counterOffers: sessionCounterOffers }) => {
        counterOfferMap[sessionId] = sessionCounterOffers;
      });
      
      setCounterOffers(counterOfferMap);
    } catch (error) {
      console.error('Error fetching counter offers:', error);
    }
  };

  const handleAcceptReject = async (sessionId: string, action: 'accept' | 'reject') => {
    setProcessingSession(sessionId);
    try {
      const response = await fetch(`/api/session/${sessionId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh sessions to show updated status
        fetchSessions();
        alert(`Session ${action}ed successfully!`);
      } else {
        alert(data.message || `Failed to ${action} session`);
      }
    } catch (error) {
      console.error(`Error ${action}ing session:`, error);
      alert(`Failed to ${action} session`);
    } finally {
      setProcessingSession(null);
    }
  };

  const handleCounterOffer = (sessionId: string) => {
    const session = sessions.find(s => s._id === sessionId);
    if (session) {
      setSessionToCounterOffer(session);
      setShowCounterOfferModal(true);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session request?')) {
      return;
    }

    setProcessingSession(sessionId);
    try {
      const response = await fetch(`/api/session/${sessionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSessions(); // Refresh sessions
        alert('Session deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    } finally {
      setProcessingSession(null);
    }
  };

  const handleEditSession = (sessionId: string) => {
    const session = sessions.find(s => s._id === sessionId);
    if (session) {
      setSessionToEdit(session);
      setShowEditModal(true);
    }
  };

  const handleCounterOfferResponse = async (counterOfferId: string, action: 'accept' | 'reject') => {
    setProcessingSession(counterOfferId);
    try {
      const response = await fetch(`/api/session/counter-offer/${counterOfferId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSessions(); // Refresh sessions and counter offers
        alert(`Counter offer ${action}ed successfully!`);
      } else {
        alert(data.message || `Failed to ${action} counter offer`);
      }
    } catch (error) {
      console.error(`Error ${action}ing counter offer:`, error);
      alert(`Failed to ${action} counter offer`);
    } finally {
      setProcessingSession(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSessionStatus = (session: Session) => {
    if (session.isAccepted === null) return 'pending';
    if (session.isAccepted === true) return 'accepted';
    if (session.isAccepted === false) return 'rejected';
    return session.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'canceled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
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

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Skill Swap Sessions with {otherUserName}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-4">
              Start your first skill swap session with {otherUserName}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Session
            </button>
          </div>
        ) : (
          sessions.map((session) => {
            const status = getSessionStatus(session);
            const isReceiver = isCurrentUserReceiver(session);
            
            return (
              <div key={session._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                {/* Session Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="capitalize">{status}</span>
                    </span>
                    {isReceiver && status === 'pending' && (
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                        Request for you
                      </span>
                    )}
                    {isCurrentUserCreator(session) && status === 'pending' && (
                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
                        Your request
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(session.startDate)}</span>
                    </div>
                    
                    {/* Inline Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {/* Buttons for Session Receiver */}
                      {canRespond(session) && (
                        <>
                          <button
                            onClick={() => handleAcceptReject(session._id, 'accept')}
                            disabled={processingSession === session._id}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleCounterOffer(session._id)}
                            disabled={processingSession === session._id}
                            className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Counter</span>
                          </button>
                          <button
                            onClick={() => handleAcceptReject(session._id, 'reject')}
                            disabled={processingSession === session._id}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Buttons for Session Creator */}
                      {canEditOrDelete(session) && (
                        <>
                          <button
                            onClick={() => handleEditSession(session._id)}
                            disabled={processingSession === session._id}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session._id)}
                            disabled={processingSession === session._id}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}

                      {/* View Button for Accepted Sessions */}
                      {session.isAccepted === true && (
                        <button
                          onClick={() => router.push(`/session/${session._id}?userId=${userId}`)}
                          className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors flex items-center space-x-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session Content */}
                <div className="space-y-4">
                  {/* What they offer */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">
                        {session.user1Id.name} offers:
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
                        {session.user2Id.name} provides:
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

                {/* Session Progress Info for Accepted Sessions */}
                {session.isAccepted === true && (
                  <div className="mt-4 pt-4 border-t bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      🎉 Session accepted! Progress tracking has been created for both participants.
                    </p>
                  </div>
                )}

                {/* Counter Offers Section */}
                {counterOffers[session._id] && counterOffers[session._id].length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Counter Offers ({counterOffers[session._id].length})
                    </h4>
                    <div className="space-y-3">
                      {counterOffers[session._id].map((counterOffer) => (
                        <div key={counterOffer._id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-orange-900">
                                Counter offer by {counterOffer.counterOfferedBy.name}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                counterOffer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                counterOffer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {counterOffer.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(counterOffer.createdAt)}
                            </div>
                          </div>
                          
                          <p className="text-sm text-orange-800 mb-3 italic">
                            "{counterOffer.counterOfferMessage}"
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div className="bg-white p-3 rounded border">
                              <div className="text-xs font-medium text-gray-600 mb-1">Offers:</div>
                              <div className="text-sm font-semibold text-blue-900">
                                {counterOffer.skill1Id?.skillTitle}
                              </div>
                              <div className="text-xs text-gray-600">
                                {counterOffer.descriptionOfService1}
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-xs font-medium text-gray-600 mb-1">Wants:</div>
                              <div className="text-sm font-semibold text-green-900">
                                {counterOffer.skill2Id?.skillTitle}
                              </div>
                              <div className="text-xs text-gray-600">
                                {counterOffer.descriptionOfService2}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-3">
                            Proposed date: {formatDate(counterOffer.startDate)}
                          </div>
                          
                          {/* Counter Offer Actions */}
                          {counterOffer.status === 'pending' && counterOffer.counterOfferedBy._id !== userId && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCounterOfferResponse(counterOffer._id, 'accept')}
                                disabled={processingSession === counterOffer._id}
                                className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                Accept Counter
                              </button>
                              <button
                                onClick={() => handleCounterOfferResponse(counterOffer._id, 'reject')}
                                disabled={processingSession === counterOffer._id}
                                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                Reject Counter
                              </button>
                            </div>
                          )}
                          
                          {counterOffer.status === 'pending' && counterOffer.counterOfferedBy._id === userId && (
                            <div className="text-xs text-orange-700">
                              Waiting for response...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchSessions(); // Refresh sessions when modal closes
        }}
        currentUserId={userId}
        otherUserId={otherUserId}
        otherUserName={otherUserName}
        chatRoomId={chatRoomId}
      />

      {/* Edit Session Modal */}
      <EditSessionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSessionToEdit(null);
        }}
        session={sessionToEdit}
        currentUserId={userId}
        onSessionUpdated={() => {
          fetchSessions(); // Refresh sessions when updated
          setShowEditModal(false);
          setSessionToEdit(null);
        }}
      />

      {/* Counter Offer Modal */}
      <CounterOfferModal
        isOpen={showCounterOfferModal}
        onClose={() => {
          setShowCounterOfferModal(false);
          setSessionToCounterOffer(null);
        }}
        session={sessionToCounterOffer}
        currentUserId={userId}
        onCounterOfferCreated={() => {
          fetchSessions(); // Refresh sessions when counter offer is created
          setShowCounterOfferModal(false);
          setSessionToCounterOffer(null);
        }}
      />
    </div>
  );
}