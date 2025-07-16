"use client";

import { useState, useCallback, useRef } from 'react';
import { invalidateUsersCaches } from '@/services/sessionApiServices';
import type { Session, CounterOffer } from '@/types';

interface SessionActionsOptions {
  userId: string;
  otherUserId: string;
  onSessionUpdate?: () => void;
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => void;
  showConfirmation: (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type?: 'danger' | 'warning' | 'info' | 'success',
    confirmText?: string
  ) => void;
}

export function useSessionActions({
  userId,
  otherUserId,
  onSessionUpdate,
  showAlert,
  showConfirmation
}: SessionActionsOptions) {
  const fetchingRef = useRef(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [counterOffers, setCounterOffers] = useState<{ [sessionId: string]: CounterOffer[] }>({});
  const [loading, setLoading] = useState(true);
  const [processingSession, setProcessingSession] = useState<string | null>(null);
  const [pendingSessionCount, setPendingSessionCount] = useState(0);
  const [activeSessionCount, setActiveSessionCount] = useState(0);

  // Fetch sessions between two users with counter offers in a single request
  const fetchSessions = useCallback(async () => {
    if (!userId || !otherUserId || fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    
    try {
      // Use the optimized endpoint that includes counter offers
      const response = await fetch(`/api/session/between-users-with-offers?user1Id=${userId}&user2Id=${otherUserId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched sessions with offers:', data.sessions);
        setSessions(data.sessions);
        
        // Set counter offers from the unified response
        setCounterOffers(data.counterOffers || {});
        
        // Calculate pending session count (sessions created by current user that are still pending)
        const pendingCount = data.sessions.filter((session: Session) => 
          session.user1Id._id === userId && 
          session.status === 'pending' && 
          session.isAccepted === null
        ).length;
        setPendingSessionCount(pendingCount);
        
        // Calculate total active session count (pending + accepted) between both users
        const activeCount = data.sessions.filter((session: Session) => 
          session.status === 'pending' || session.status === 'active'
        ).length;
        setActiveSessionCount(activeCount);
        
        // Notify parent component about session updates
        if (onSessionUpdate) {
          onSessionUpdate();
        }
      } else {
        console.error('Failed to fetch sessions:', data.message);
        setSessions([]);
        setCounterOffers({});
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
      setCounterOffers({});
      showAlert('error', 'Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [userId, otherUserId, onSessionUpdate, showAlert]);

  // Handle session accept/reject
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
        fetchSessions();
        showAlert('success', `Session ${action}ed successfully!`);
        invalidateUsersCaches(userId, otherUserId);
      } else {
        showAlert('error', data.message || `Failed to ${action} session`);
      }
    } catch (error) {
      console.error(`Error ${action}ing session:`, error);
      showAlert('error', `Failed to ${action} session`);
    } finally {
      setProcessingSession(null);
    }
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionId: string) => {
    showConfirmation(
      'Delete Session',
      'Are you sure you want to delete this session request? This action cannot be undone.',
      async () => {
        setProcessingSession(sessionId);
        try {
          const response = await fetch(`/api/session/${sessionId}`, {
            method: 'DELETE',
          });

          const data = await response.json();
          
          if (data.success) {
            fetchSessions();
            showAlert('success', 'Session deleted successfully!');
          } else {
            showAlert('error', data.message || 'Failed to delete session');
          }
        } catch (error) {
          console.error('Error deleting session:', error);
          showAlert('error', 'Failed to delete session');
        } finally {
          setProcessingSession(null);
        }
      },
      'danger',
      'Delete'
    );
  };

  // Handle counter offer response
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
        fetchSessions();
        showAlert('success', `Counter offer ${action}ed successfully!`);
      } else {
        showAlert('error', data.message || `Failed to ${action} counter offer`);
      }
    } catch (error) {
      console.error(`Error ${action}ing counter offer:`, error);
      showAlert('error', `Failed to ${action} counter offer`);
    } finally {
      setProcessingSession(null);
    }
  };

  // Handle completion request
  const handleRequestCompletion = async (sessionId: string) => {
    showConfirmation(
      'Request Session Completion',
      'Are you sure you want to request session completion? This will notify the other participant for approval.',
      async () => {
        setProcessingSession(sessionId);
        
        try {
          const response = await fetch('/api/session/completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              userId,
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            showAlert('success', 'Completion request sent successfully! Waiting for approval from the other participant.');
            fetchSessions();
          } else {
            showAlert('error', data.message || 'Failed to request completion');
          }
        } catch (error) {
          console.error('Error requesting completion:', error);
          showAlert('error', 'Failed to request completion');
        } finally {
          setProcessingSession(null);
        }
      },
      'info',
      'Send Request'
    );
  };

  // Handle completion response
  const handleCompletionResponse = async (
    sessionId: string, 
    action: 'approve' | 'reject', 
    providedRejectionReason?: string,
    onShowRatingModal?: (session: Session) => void
  ) => {
    const confirmMessage = action === 'approve' 
      ? 'Are you sure you want to approve session completion? This will mark the session as completed.'
      : 'Are you sure you want to reject the completion request?';

    showConfirmation(
      action === 'approve' ? 'Approve Completion' : 'Reject Completion',
      confirmMessage,
      async () => {
        setProcessingSession(sessionId);
        
        try {
          const requestBody: any = {
            sessionId,
            userId,
            action,
          };

          if (action === 'reject' && providedRejectionReason) {
            requestBody.rejectionReason = providedRejectionReason;
          }

          const response = await fetch('/api/session/completion', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          
          if (data.success) {
            if (action === 'approve') {
              showAlert('success', 'Session completed successfully!');
              
              await fetchSessions();
              
              // Show rating modal for the user who approved
              const completedSession = sessions.find(s => s._id === sessionId);
              if (completedSession && onShowRatingModal) {
                onShowRatingModal(completedSession);
              }
            } else {
              showAlert('info', 'Completion request rejected');
            }
            
            setTimeout(() => {
              fetchSessions();
            }, 1000);
          } else {
            showAlert('error', data.message || `Failed to ${action} completion`);
          }
        } catch (error) {
          console.error(`Error ${action}ing completion:`, error);
          showAlert('error', `Failed to ${action} completion`);
        } finally {
          setProcessingSession(null);
        }
      },
      action === 'approve' ? 'success' : 'warning',
      action === 'approve' ? 'Approve' : 'Reject'
    );
  };

  // Handle rating submission
  const handleRatingSubmit = async (
    sessionToRate: Session,
    rating: number,
    ratingComment: string,
    onSuccess: () => void
  ) => {
    if (!sessionToRate || rating === 0) {
      showAlert('warning', 'Please provide a rating');
      return false;
    }

    if (!ratingComment.trim()) {
      showAlert('warning', 'Please provide a comment');
      return false;
    }

    try {
      const otherUser = sessionToRate.user1Id._id === userId ? sessionToRate.user2Id : sessionToRate.user1Id;
      const mySkill = sessionToRate.user1Id._id === userId ? sessionToRate.skill1Id : sessionToRate.skill2Id;

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionToRate._id,
          reviewerId: userId,
          revieweeId: otherUser._id,
          rating,
          comment: ratingComment.trim(),
          skillId: mySkill._id,
          reviewType: 'skill_learning',
        }),
      });

      const data = await response.json();

      if (data.success) {
        showAlert('success', 'Rating submitted successfully!');
        onSuccess();
        return true;
      } else {
        showAlert('error', data.message || 'Failed to submit rating');
        return false;
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showAlert('error', 'Failed to submit rating');
      return false;
    }
  };

  return {
    // State
    sessions,
    counterOffers,
    loading,
    processingSession,
    pendingSessionCount,
    activeSessionCount,
    
    // Actions
    fetchSessions,
    handleAcceptReject,
    handleDeleteSession,
    handleCounterOfferResponse,
    handleRequestCompletion,
    handleCompletionResponse,
    handleRatingSubmit,
    
    // Setters for state management
    setLoading,
    setSessions,
    setCounterOffers,
    setPendingSessionCount,
    setActiveSessionCount
  };
}
