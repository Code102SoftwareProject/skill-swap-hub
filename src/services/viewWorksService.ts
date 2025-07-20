import { createSystemApiHeaders } from '@/utils/systemApiAuth';

class ViewWorksService {
  // Work review methods
  async reviewWork(workId: string, action: 'accept' | 'reject', userId: string, message: string): Promise<any> {
    try {
      const response = await fetch(`/api/work/${workId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          userId: userId,
          rejectionReason: action === 'reject' ? message : undefined,
          remark: action === 'accept' ? message : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to review work');
      }

      return await response.json();
    } catch (error) {
      console.error('Error reviewing work:', error);
      throw error;
    }
  }

  // Fetch works for session
  async fetchWorks(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/work/session/${sessionId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch works');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching works:', error);
      throw error;
    }
  }

  // File download
  async downloadFile(fileURL: string, fileName?: string): Promise<void> {
    try {
      const downloadUrl = `/api/file/retrieve?fileUrl=${encodeURIComponent(fileURL)}`;
      
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
        
        // Try to get more detailed error information
        let errorMessage = 'Failed to download file';
        try {
          const errorData = await response.json();
          console.error('Server error details:', errorData);
          errorMessage = errorData.message || errorData.errorDetails || errorMessage;
        } catch (jsonError) {
          console.error('Could not parse error response as JSON:', jsonError);
          errorMessage = `${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Try to get filename from content-disposition header or use provided name
      const contentDisposition = response.headers.get('content-disposition');
      let downloadFileName = fileName || 'attachment';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          downloadFileName = filenameMatch[1];
        }
      }
      
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('ViewWorksService: Error downloading file:', error);
      throw error;
    }
  }

  // Send notification
  async sendNotification(userId: string, typeno: number, description: string, targetDestination?: string): Promise<void> {
    try {
      await fetch('/api/notification', {
        method: 'POST',
        headers: createSystemApiHeaders(),
        body: JSON.stringify({
          userId,
          typeno,
          description,
          targetDestination,
          broadcast: false
        }),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw error - notifications should not break the main functionality
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
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  getUserName(user: any, currentUserId: string, otherUserDetails?: any): string {
    if (user._id === currentUserId) {
      return 'You';
    }
    if (otherUserDetails && user._id === otherUserDetails._id) {
      const fullName = `${otherUserDetails.firstName || ''} ${otherUserDetails.lastName || ''}`.trim();
      return fullName || otherUserDetails.name || 'Unknown User';
    }
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.name || 'Unknown User';
  }
}

const viewWorksService = new ViewWorksService();
export default viewWorksService;
