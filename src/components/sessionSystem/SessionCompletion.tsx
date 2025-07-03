'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface SessionCompletionProps {
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

export default function SessionCompletion({ session, currentUserId, onSessionUpdate }: SessionCompletionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const isUser1 = session.user1Id._id === currentUserId;
  const otherUser = isUser1 ? session.user2Id : session.user1Id;
  const mySkill = isUser1 ? session.skill1Id : session.skill2Id;
  const otherSkill = isUser1 ? session.skill2Id : session.skill1Id;

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

  const getStatusBadge = () => {
    if (session.status === 'completed') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" />Completed</Badge>;
    }
    if (session.completionRequestedBy) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-4 h-4 mr-1" />Completion Requested</Badge>;
    }
    if (session.status === 'active') {
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{session.status}</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Session with {otherUser.firstName} {otherUser.lastName}</span>
          {getStatusBadge()}
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>You're teaching: <span className="font-medium">{mySkill.skillTitle}</span></p>
          <p>You're learning: <span className="font-medium">{otherSkill.skillTitle}</span></p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Status Information */}
        {session.status === 'completed' && (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Session Completed!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              This session has been successfully completed. You can now leave a review.
            </p>
          </div>
        )}

        {/* Completion Request Status */}
        {hasRequestedCompletion && session.status !== 'completed' && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center text-yellow-800">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-medium">Completion Request Sent</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              Waiting for {otherUser.firstName} to approve the completion of this session.
            </p>
          </div>
        )}

        {/* Needs Approval */}
        {needsToApprove && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center text-blue-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Completion Request Received</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              {session.completionRequestedBy?.firstName} has requested to complete this session.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex space-x-2">
                <Button 
                  onClick={handleApproveCompletion} 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve Completion
                </Button>
              </div>
              <div className="space-y-2">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (e.g., 'Please finish the remaining tasks first')"
                  className="w-full p-2 border rounded-md text-sm"
                  rows={2}
                />
                <Button 
                  onClick={handleRejectCompletion} 
                  disabled={isLoading || !rejectionReason.trim()}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject Request
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Notice */}
        {wasRejected && (
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center text-red-800">
              <XCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Completion Request Rejected</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              {session.completionRejectedBy?.firstName} rejected your completion request:
            </p>
            <p className="text-sm text-red-700 mt-1 font-medium">
              "{session.completionRejectionReason}"
            </p>
            <p className="text-sm text-red-600 mt-2">
              You can request completion again once you've addressed the feedback.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          {canRequestCompletion && (
            <Button 
              onClick={handleRequestCompletion} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Session as Finished
            </Button>
          )}

          {session.status === 'completed' && (
            <Button 
              onClick={() => {/* Navigate to review page */}}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Star className="w-4 h-4 mr-2" />
              Leave Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
