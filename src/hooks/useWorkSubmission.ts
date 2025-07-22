import { useState, useEffect, useCallback } from 'react';
import { WorkService } from '@/services/workService';
import type { WorkSubmissionData } from '@/services/workService';
import type { Work, FileWithTitle } from '@/types';

export interface UseWorkSubmissionReturn {
  // Form state
  workDescription: string;
  setWorkDescription: (value: string) => void;
  workFiles: FileWithTitle[];
  setWorkFiles: (files: FileWithTitle[]) => void;
  
  // Submission state
  uploading: boolean;
  
  // Data
  works: Work[];
  userWorks: Work[];
  
  // Actions
  handleSubmitWork: (e: React.FormEvent) => Promise<void>;
  handleDownloadFile: (fileURL: string, fileName?: string) => Promise<void>;
  clearForm: () => void;
  refreshWorks: () => Promise<void>;
  
  // File management
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  updateFileTitle: (index: number, title: string) => void;
}

export function useWorkSubmission(
  sessionId: string,
  currentUserId: string,
  session: any, // Add session object to get other user info
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void,
  onWarning?: (message: string) => void
): UseWorkSubmissionReturn {
  // Form state
  const [workDescription, setWorkDescription] = useState('');
  const [workFiles, setWorkFiles] = useState<FileWithTitle[]>([]);
  
  // Submission state
  const [uploading, setUploading] = useState(false);
  
  // Data state
  const [works, setWorks] = useState<Work[]>([]);

  // Derived state
  const userWorks = works.filter(w => w.provideUser._id === currentUserId);

  const clearForm = useCallback(() => {
    setWorkDescription('');
    setWorkFiles([]);
  }, []);

  const refreshWorks = useCallback(async () => {
    try {
      const fetchedWorks = await WorkService.getSessionWorks(sessionId);
      setWorks(fetchedWorks);
    } catch (error) {
      console.error('Error fetching works:', error);
      onError?.('Failed to load submitted works');
    }
  }, [sessionId, onError]);

  // Fetch works on mount and when sessionId changes
  useEffect(() => {
    if (sessionId) {
      refreshWorks();
    }
  }, [sessionId, refreshWorks]);

  const handleSubmitWork = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workDescription.trim()) {
      onWarning?.('Please provide a work description');
      return;
    }

    if (!sessionId || !currentUserId || !session) {
      onError?.('Session or user information not available');
      return;
    }

    // Calculate receiveUserId (the other user in the session)
    const receiveUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;

    setUploading(true);
    
    try {
      const submissionData: WorkSubmissionData = {
        sessionId,
        currentUserId,
        receiveUserId,
        workDescription: workDescription.trim(),
        workFiles,
      };

      const result = await WorkService.submitWork(submissionData);
      
      if (result.success) {
        onSuccess?.('Work submitted successfully!');
        
        // Clear form
        clearForm();
        
        // Refresh works list
        await refreshWorks();
      } else {
        onError?.(result.message || 'Failed to submit work');
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      onError?.('Failed to submit work');
    } finally {
      setUploading(false);
    }
  }, [workDescription, workFiles, sessionId, currentUserId, session, onSuccess, onError, onWarning, refreshWorks, clearForm]);

  const handleDownloadFile = useCallback(async (fileURL: string, fileName?: string) => {
    try {
      await WorkService.downloadFile(fileURL, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      onError?.('Failed to download file');
    }
  }, [onError]);

  const addFiles = useCallback((files: File[]) => {
    if (workFiles.length + files.length > 5) {
      onWarning?.('Maximum 5 files allowed');
      return;
    }
    
    const maxSizeMB = 25;
    const maxSizeBytes = maxSizeMB * 1024 * 1024; // 25MB in bytes
    
    // Filter out files that are too large (secondary validation)
    const validFiles = files.filter(file => {
      if (file.size > maxSizeBytes) {
        onError?.(`File "${file.name}" is too large. Maximum file size is ${maxSizeMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) {
      return; // No valid files to add
    }
    
    const newFiles = validFiles.map(file => ({
      file,
      title: file.name.split('.').slice(0, -1).join('.') || 'Uploaded File'
    }));
    
    setWorkFiles(prev => [...prev, ...newFiles]);
  }, [workFiles.length, onWarning, onError]);

  const removeFile = useCallback((index: number) => {
    setWorkFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateFileTitle = useCallback((index: number, title: string) => {
    setWorkFiles(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], title };
      return updated;
    });
  }, []);

  return {
    // Form state
    workDescription,
    setWorkDescription,
    workFiles,
    setWorkFiles,
    
    // Submission state
    uploading,
    
    // Data
    works,
    userWorks,
    
    // Actions
    handleSubmitWork,
    handleDownloadFile,
    clearForm,
    refreshWorks,
    
    // File management
    addFiles,
    removeFile,
    updateFileTitle,
  };
}
