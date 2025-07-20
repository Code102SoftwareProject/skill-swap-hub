// Helper functions for session completion status
export interface CompletionStatus {
  canRequestCompletion: boolean;
  hasRequestedCompletion: boolean;
  needsToApprove: boolean;
  wasRejected: boolean;
  isCompleted: boolean;
  pendingRequests: any[];
  requesterName?: string;
}

export async function getSessionCompletionStatus(
  sessionId: string, 
  currentUserId: string,
  token: string
): Promise<CompletionStatus> {
  try {
    // Fetch completion requests for this session
    const response = await fetch(`/api/session/completion?sessionId=${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    
    if (!data.success) {
      console.error('Failed to fetch completion requests:', data.message);
      return {
        canRequestCompletion: true,
        hasRequestedCompletion: false,
        needsToApprove: false,
        wasRejected: false,
        isCompleted: false,
        pendingRequests: []
      };
    }

    const completionRequests = data.completionRequests || [];
    
    // Get pending requests
    const pendingRequests = completionRequests.filter((req: any) => req.status === 'pending');
    
    // Check if current user has requested completion
    const myPendingRequest = pendingRequests.find((req: any) => 
      req.requestedBy._id === currentUserId || req.requestedBy === currentUserId
    );
    
    // Check if other user has requested completion
    const otherPendingRequest = pendingRequests.find((req: any) => 
      req.requestedBy._id !== currentUserId && req.requestedBy !== currentUserId
    );
    
    // Check if current user has been rejected recently
    const recentRejection = completionRequests.find((req: any) => 
      (req.requestedBy._id === currentUserId || req.requestedBy === currentUserId) && 
      req.status === 'rejected' &&
      new Date(req.rejectedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Within last 24 hours
    );

    return {
      canRequestCompletion: !myPendingRequest && !recentRejection,
      hasRequestedCompletion: !!myPendingRequest,
      needsToApprove: !!otherPendingRequest,
      wasRejected: !!recentRejection,
      isCompleted: false, // This should come from session.status
      pendingRequests: pendingRequests,
      requesterName: otherPendingRequest?.requestedBy?.firstName
    };
    
  } catch (error) {
    console.error('Error fetching completion status:', error);
    return {
      canRequestCompletion: true,
      hasRequestedCompletion: false,
      needsToApprove: false,
      wasRejected: false,
      isCompleted: false,
      pendingRequests: []
    };
  }
}
