class OverviewService {
  // Session completion methods
  async requestCompletion(sessionId: string, userId: string): Promise<any> {
    try {
      const response = await fetch('/api/session/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request completion');
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting completion:', error);
      throw error;
    }
  }

  async respondToCompletion(sessionId: string, userId: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<any> {
    try {
      const response = await fetch('/api/session/completion', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId, 
          userId,
          action,
          rejectionReason 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to respond to completion');
      }

      return await response.json();
    } catch (error) {
      console.error('Error responding to completion:', error);
      throw error;
    }
  }

  // Session cancellation methods
  async requestCancellation(sessionId: string, reason: string, description: string, evidenceFiles: File[]): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('reason', reason);
      formData.append('description', description);
      
      evidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });

      const response = await fetch('/api/sessions/cancel/request', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request cancellation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting cancellation:', error);
      throw error;
    }
  }

  async respondToCancellation(
    sessionId: string, 
    responderId: string,
    action: 'agree' | 'dispute', 
    responseDescription: string,
    workCompletionPercentage?: number,
    responseEvidenceFiles: string[] = []
  ): Promise<any> {
    try {
      const response = await fetch(`/api/session/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responderId,
          action,
          responseDescription,
          workCompletionPercentage,
          responseEvidenceFiles
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to respond to cancellation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error responding to cancellation:', error);
      throw error;
    }
  }

  async finalizeCancellation(sessionId: string, finalNote: string): Promise<any> {
    try {
      const response = await fetch('/api/sessions/cancel/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId, 
          finalNote 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to finalize cancellation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error finalizing cancellation:', error);
      throw error;
    }
  }

  // Review methods
  async submitReview(sessionId: string, rating: number, comment: string): Promise<any> {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId, 
          rating, 
          comment 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit review');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  async fetchReviews(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/reviews?sessionId=${sessionId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch reviews');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  // Cancel request fetching
  async fetchCancelRequest(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/session/${sessionId}/cancel`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch cancel request');
      }

      const data = await response.json();
      return data.cancelRequest;
    } catch (error) {
      console.error('Error fetching cancel request:', error);
      throw error;
    }
  }

  // Session cancellation methods
  async cancelSession(sessionId: string, initiatorId: string, reason: string, description: string, evidenceFiles: string[] = []): Promise<any> {
    try {
      const response = await fetch(`/api/session/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initiatorId,
          reason,
          description,
          evidenceFiles
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel session');
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling session:', error);
      throw error;
    }
  }

  // File download
  async downloadFile(fileURL: string, fileName?: string): Promise<void> {
    try {
      console.log('OverviewService: Downloading file', { fileURL, fileName });
      
      const response = await fetch(`/api/file/retrieve?fileUrl=${encodeURIComponent(fileURL)}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('OverviewService: File download completed');
    } catch (error) {
      console.error('OverviewService: Error downloading file:', error);
      throw error;
    }
  }

  // Utility methods
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  cleanDescription(description: string): string {
    if (!description) return '';
    return description.replace(/<[^>]*>/g, '').trim();
  }

  getOtherUserName(session: any, currentUserId: string): string {
    if (!session) return 'Unknown User';
    
    const otherUser = session.user1Id._id === currentUserId ? session.user2Id : session.user1Id;
    return this.getUserName(otherUser);
  }

  getUserName(user: any): string {
    if (!user) return 'Unknown User';
    return user.name || user.username || user.email || 'Unknown User';
  }

  getExpectedEndDate(session: any, myProgress: any, otherProgress: any): string {
    if (!session) return 'N/A';
    
    if (session.expectedEndDate) {
      return this.formatDate(session.expectedEndDate);
    }
    
    const dueDates = [];
    if (myProgress?.dueDate) dueDates.push(new Date(myProgress.dueDate));
    if (otherProgress?.dueDate) dueDates.push(new Date(otherProgress.dueDate));
    
    if (dueDates.length === 0) return 'Not set';
    
    const earliestDate = new Date(Math.min(...dueDates.map(d => d.getTime())));
    return this.formatDate(earliestDate.toISOString());
  }

  getCompletionStatus(session: any, currentUserId: string): any {
    if (!session || session.status !== 'active') {
      return {
        canRequestCompletion: false,
        hasRequestedCompletion: false,
        needsToApprove: false,
      };
    }

    const hasRequestedCompletion = session.completionRequestedBy && 
                                  session.completionRequestedBy === currentUserId;
    
    const needsToApprove = session.completionRequestedBy && 
                          session.completionRequestedBy !== currentUserId;
    
    const canRequestCompletion = !session.completionRequestedBy;

    return {
      canRequestCompletion,
      hasRequestedCompletion,
      needsToApprove,
    };
  }
}

const overviewService = new OverviewService();
export default overviewService;
