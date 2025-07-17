// Progress Service - Handles all progress-related API operations
export interface SessionProgress {
  _id: string;
  userId: string | any;
  sessionId: string;
  startDate: string;
  dueDate?: string;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressUpdateData {
  userId: string;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  notes?: string;
}

class ProgressService {
  /**
   * Fetch progress data for a specific session
   */
  async fetchSessionProgress(sessionId: string): Promise<{
    success: boolean;
    progress?: SessionProgress[];
    message?: string;
  }> {
    try {
      const response = await fetch(`/api/session-progress/${sessionId}`);
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          progress: data.progress || []
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to fetch progress'
        };
      }
    } catch (error) {
      console.error('Error fetching session progress:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  /**
   * Update progress for a user in a session
   */
  async updateProgress(sessionId: string, progressData: ProgressUpdateData): Promise<{
    success: boolean;
    progress?: SessionProgress;
    message?: string;
  }> {
    try {
      // Validate data
      if (progressData.completionPercentage < 0 || progressData.completionPercentage > 100) {
        return {
          success: false,
          message: 'Progress must be between 0 and 100'
        };
      }

      const response = await fetch(`/api/session-progress/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          progress: data.progress,
          message: 'Progress updated successfully'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to update progress'
        };
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  /**
   * Auto-determine status based on progress percentage
   */
  getAutoStatus(progress: number): 'not_started' | 'in_progress' | 'completed' | 'abandoned' {
    if (progress === 0) {
      return 'not_started';
    } else if (progress === 100) {
      return 'completed';
    } else if (progress > 0) {
      return 'in_progress';
    }
    return 'not_started';
  }

  /**
   * Get display text for status
   */
  getStatusDisplayText(status: string): string {
    return status.replace('_', ' ');
  }

  /**
   * Get status color classes
   */
  getStatusColorClasses(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'abandoned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Calculate overall progress for two users
   */
  calculateOverallProgress(progress1?: SessionProgress | null, progress2?: SessionProgress | null): number {
    if (!progress1 || !progress2) {
      return progress1?.completionPercentage || progress2?.completionPercentage || 0;
    }
    return Math.round((progress1.completionPercentage + progress2.completionPercentage) / 2);
  }

  /**
   * Check if session is completed (both users at 100%)
   */
  isSessionCompleted(progress1?: SessionProgress | null, progress2?: SessionProgress | null): boolean {
    return !!(progress1?.completionPercentage === 100 && progress2?.completionPercentage === 100);
  }

  /**
   * Send notification helper
   */
  async sendNotification(userId: string, typeno: number, description: string, targetDestination?: string): Promise<void> {
    try {
      await fetch('/api/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    }
  }
}

export const progressService = new ProgressService();
