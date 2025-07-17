import { useState, useEffect, useCallback } from 'react';
import { progressService, SessionProgress, ProgressUpdateData } from '../services/progressService';

interface ProgressFormState {
  percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  notes: string;
}

interface UseProgressProps {
  sessionId: string;
  currentUserId: string;
  session?: any;
  user?: any;
}

export interface UseProgressReturn {
  // Progress data
  myProgress: SessionProgress | null;
  otherProgress: SessionProgress | null;
  loading: boolean;
  
  // Editor state
  isEditing: boolean;
  form: ProgressFormState;
  updating: boolean;
  
  // Actions
  fetchProgress: () => Promise<void>;
  openEditor: () => void;
  closeEditor: () => void;
  updateForm: (updates: Partial<ProgressFormState>) => void;
  submitProgress: () => Promise<{ success: boolean; message?: string }>;
  
  // Utilities
  formatDate: (dateString: string) => string;
  getOtherUserName: () => string;
  getOverallProgress: () => number;
  isSessionCompleted: () => boolean;
}

export function useProgress({ sessionId, currentUserId, session, user }: UseProgressProps): UseProgressReturn {
  // Progress data state
  const [myProgress, setMyProgress] = useState<SessionProgress | null>(null);
  const [otherProgress, setOtherProgress] = useState<SessionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState<ProgressFormState>({
    percentage: 0,
    status: 'not_started',
    notes: ''
  });

  /**
   * Fetch progress data for the session
   */
  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const result = await progressService.fetchSessionProgress(sessionId);
      
      if (result.success && result.progress && currentUserId) {
        // Find my progress and other user's progress
        const myProg = result.progress.find((p: SessionProgress) => {
          const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
          return progUserId.toString() === currentUserId.toString();
        });
        
        const otherProg = result.progress.find((p: SessionProgress) => {
          const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
          return progUserId.toString() !== currentUserId.toString();
        });
        
        setMyProgress(myProg || null);
        setOtherProgress(otherProg || null);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, currentUserId]);

  /**
   * Open progress editor
   */
  const openEditor = useCallback(() => {
    setForm({
      percentage: myProgress?.completionPercentage || 0,
      status: myProgress?.status || 'not_started',
      notes: myProgress?.notes || ''
    });
    setIsEditing(true);
  }, [myProgress]);

  /**
   * Close progress editor
   */
  const closeEditor = useCallback(() => {
    setIsEditing(false);
    setForm({ percentage: 0, status: 'not_started', notes: '' });
  }, []);

  /**
   * Update form state
   */
  const updateForm = useCallback((updates: Partial<ProgressFormState>) => {
    setForm(prev => ({ ...prev, ...updates }));
    
    // Auto-update status based on percentage if percentage is being updated
    if (updates.percentage !== undefined) {
      const autoStatus = progressService.getAutoStatus(updates.percentage);
      setForm(prev => ({ ...prev, status: autoStatus, ...updates }));
    }
  }, []);

  /**
   * Format date utility
   */
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  /**
   * Get other user name
   */
  const getOtherUserName = useCallback(() => {
    if (!session) return 'Other User';
    
    const otherUser = session.user1Id._id === currentUserId ? session.user2Id : session.user1Id;
    return otherUser?.name || `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'Other User';
  }, [session, currentUserId]);

  /**
   * Submit progress update
   */
  const submitProgress = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (!currentUserId) {
      return { success: false, message: 'User authentication required' };
    }

    setUpdating(true);
    
    try {
      const progressData: ProgressUpdateData = {
        userId: currentUserId,
        completionPercentage: form.percentage,
        status: form.status,
        notes: form.notes,
      };

      const result = await progressService.updateProgress(sessionId, progressData);
      
      if (result.success) {
        // Send notifications
        if (session && user) {
          const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
          const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
          
          // Progress update notification
          await progressService.sendNotification(
            otherUserId,
            15, // PROGRESS_UPDATED
            `${currentUserName} updated their progress to ${form.percentage}% (${progressService.getStatusDisplayText(form.status)})`,
            `/session/${sessionId}`
          );
          
          // Milestone notification
          if (form.percentage === 50 || form.percentage === 100) {
            await progressService.sendNotification(
              otherUserId,
              16, // PROGRESS_MILESTONE
              `${currentUserName} reached ${form.percentage}% completion milestone!`,
              `/session/${sessionId}`
            );
          }
        }

        // Close editor and refresh data
        setIsEditing(false);
        await fetchProgress();
        
        // Check for session completion
        if (form.percentage === 100) {
          setTimeout(async () => {
            try {
              const freshResult = await progressService.fetchSessionProgress(sessionId);
              
              if (freshResult.success && freshResult.progress && session && user) {
                const myFreshProgress = freshResult.progress.find((p: SessionProgress) => {
                  const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
                  return progUserId.toString() === currentUserId.toString();
                });
                
                const otherFreshProgress = freshResult.progress.find((p: SessionProgress) => {
                  const progUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
                  return progUserId.toString() !== currentUserId.toString();
                });
                
                if (progressService.isSessionCompleted(myFreshProgress, otherFreshProgress)) {
                  const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
                  const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
                  const otherUserName = getOtherUserName();
                  
                  // Send completion notifications
                  await progressService.sendNotification(
                    otherUserId,
                    22, // SESSION_COMPLETED
                    `🎉 Session completed! Both you and ${currentUserName} have reached 100% completion!`,
                    `/session/${sessionId}`
                  );
                  
                  await progressService.sendNotification(
                    currentUserId,
                    22, // SESSION_COMPLETED
                    `🎉 Congratulations! You and ${otherUserName} have successfully completed this session!`,
                    `/session/${sessionId}`
                  );
                }
              }
            } catch (error) {
              console.error('Error checking session completion:', error);
            }
          }, 1000);
        }
        
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      return { success: false, message: 'Failed to update progress' };
    } finally {
      setUpdating(false);
    }
  }, [currentUserId, sessionId, form, session, user, fetchProgress, getOtherUserName]);

  /**
   * Get overall progress percentage
   */
  const getOverallProgress = useCallback(() => {
    return progressService.calculateOverallProgress(myProgress, otherProgress);
  }, [myProgress, otherProgress]);

  /**
   * Check if session is completed
   */
  const isSessionCompleted = useCallback(() => {
    return progressService.isSessionCompleted(myProgress, otherProgress);
  }, [myProgress, otherProgress]);

  // Initial fetch
  useEffect(() => {
    if (sessionId && currentUserId) {
      fetchProgress();
    }
  }, [sessionId, currentUserId, fetchProgress]);

  return {
    // Progress data
    myProgress,
    otherProgress,
    loading,
    
    // Editor state
    isEditing,
    form,
    updating,
    
    // Actions
    fetchProgress,
    openEditor,
    closeEditor,
    updateForm,
    submitProgress,
    
    // Utilities
    formatDate,
    getOtherUserName,
    getOverallProgress,
    isSessionCompleted
  };
}
