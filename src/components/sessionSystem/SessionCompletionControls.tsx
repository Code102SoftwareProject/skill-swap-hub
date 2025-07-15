'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface SessionCompletionControlsProps {
  session: {
    _id: string;
    status: string;
    user1Id: { _id: string; firstName: string; lastName: string };
    user2Id: { _id: string; firstName: string; lastName: string };
    skill1Id: { skillTitle: string };
    skill2Id: { skillTitle: string };
    completionRequestedBy?: { _id: string; firstName: string; lastName: string };
    completionRequestedAt?: string;
    completionApprovedBy?: { _id: string; firstName: string; lastName: string };
    completionRejectedBy?: { _id: string; firstName: string; lastName: string };
    completionRejectionReason?: string;
  };
  currentUserId: string;
  onSessionUpdate: (updatedSession: any) => void;
}

export default function SessionCompletionControls({ 
  session, 
  currentUserId, 
  onSessionUpdate 
}: SessionCompletionControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  const isUser1 = session.user1Id._id === currentUserId;
  const otherUser = isUser1 ? session.user2Id : session.user1Id;

  const canRequestCompletion = session.status === 'active' && !session.completionRequestedBy;
  const hasRequestedCompletion = session.completionRequestedBy?._id === currentUserId;
  const needsToApprove = session.completionRequestedBy && session.completionRequestedBy._id !== currentUserId;
  const wasRejected = session.completionRejectedBy && session.completionRequestedBy?._id === currentUserId;

  const handleRequestCompletion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/session/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session._id,
          userId: currentUserId
        })
      });

      const data = await response.json();
      if (data.success) {
        onSessionUpdate(data.session);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error requesting completion:', error);
      alert('Error requesting completion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveCompletion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/session/completion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session._id,
          userId: currentUserId,
          action: 'approve'
        })
      });

      const data = await response.json();
      if (data.success) {
        onSessionUpdate(data.session);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error approving completion:', error);
      alert('Error approving completion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectCompletion = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/session/completion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session._id,
          userId: currentUserId,
          action: 'reject',
          rejectionReason
        })
      });

      const data = await response.json();
      if (data.success) {
        onSessionUpdate(data.session);
        setRejectionReason('');
        setShowRejectionInput(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error rejecting completion:', error);
      alert('Error rejecting completion');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if session is not active or already completed
  if (session.status !== 'active' && session.status !== 'completed') {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Completion Status Indicators */}
      {session.status === 'completed' && (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center text-green-800">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Session Completed!</span>
          </div>
          <Button
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700"
            onClick={() => {/* Navigate to review */}}
          >
            <Star className="w-4 h-4 mr-1" />
            Leave Review
          </Button>
        </div>
      )}

      {/* Completion Request Sent */}
      {hasRequestedCompletion && session.status !== 'completed' && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center text-yellow-800">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-medium">Completion Request Sent</span>
          </div>
          <p className="text-sm text-yellow-600 mt-1">
            Waiting for {otherUser.firstName} to approve the completion.
          </p>
        </div>
      )}

      {/* Needs Approval */}
      {needsToApprove && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-blue-800 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Completion Request Received</span>
          </div>
          <p className="text-sm text-blue-600 mb-3">
            {session.completionRequestedBy?.firstName} has requested to complete this session.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleApproveCompletion} 
              disabled={isLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            
            <Button 
              onClick={() => setShowRejectionInput(!showRejectionInput)}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>

          {showRejectionInput && (
            <div className="mt-3 space-y-2">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason (e.g., 'Please finish the remaining tasks first')"
                className="w-full p-2 border rounded-md text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleRejectCompletion} 
                  disabled={isLoading || !rejectionReason.trim()}
                  size="sm"
                  variant="destructive"
                >
                  Submit Rejection
                </Button>
                <Button 
                  onClick={() => {
                    setShowRejectionInput(false);
                    setRejectionReason('');
                  }}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rejection Notice */}
      {wasRejected && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center text-red-800">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Completion Request Rejected</span>
          </div>
          <p className="text-sm text-red-600 mt-1">
            {session.completionRejectedBy?.firstName} rejected your completion request:
          </p>
          <p className="text-sm text-red-700 mt-1 font-medium bg-red-100 p-2 rounded">
            "{session.completionRejectionReason}"
          </p>
          <p className="text-sm text-red-600 mt-2">
            You can request completion again once you've addressed the feedback.
          </p>
        </div>
      )}

      {/* Request Completion Button */}
      {canRequestCompletion && (
        <div className="flex justify-end">
          <Button 
            onClick={handleRequestCompletion} 
            disabled={isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Session as Finished
          </Button>
        </div>
      )}
    </div>
  );
}
