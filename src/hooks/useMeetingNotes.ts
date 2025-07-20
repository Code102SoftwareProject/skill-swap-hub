import { useState, useCallback, useEffect, useRef } from 'react';

interface MeetingNotes {
  _id?: string;
  meetingId: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  isPrivate: boolean;
  wordCount: number;
  autoSaveCount: number;
  lastModified: string;
  createdAt: string;
}

interface UseMeetingNotesProps {
  meetingId?: string;
  userId?: string;
  userName?: string;
  token?: string;  // Add JWT token for authentication
  autoSaveDelay?: number;
}

export const useMeetingNotes = ({ 
  meetingId, 
  userId, 
  userName,
  token,  // Add token parameter
  autoSaveDelay = 2000 
}: UseMeetingNotesProps) => {
  const [notes, setNotes] = useState<MeetingNotes | null>(null);
  
  // Helper function to create auth headers
  const createAuthHeaders = useCallback(() => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }, [token]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);

  // Load notes when component mounts or IDs change
  const loadNotes = useCallback(async () => {
    if (!meetingId || !userId) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/meeting-notes?meetingId=${meetingId}&userId=${userId}`, {
        headers: createAuthHeaders()
      });
      const data = await response.json();
      
      if (response.ok) {
        if (data._id) {
          setNotes(data);
        } else {
          setNotes({
            meetingId,
            userId,
            userName: userName || 'Anonymous',
            title: 'Meeting Notes',
            content: '',
            isPrivate: true,
            wordCount: 0,
            autoSaveCount: 0,
            lastModified: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setError(data.message || 'Failed to load notes');
      }
    } catch (err) {
      setError('Network error while loading notes');
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, userId, userName, createAuthHeaders]);

  // Save notes to server
  const saveNotes = useCallback(async (notesToSave?: Partial<MeetingNotes>) => {
    if (!meetingId || !userId || !userName) {
      return false;
    }
    
    const dataToSave = notesToSave || notes;
    if (!dataToSave) {
      return false;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/meeting-notes', {
        method: 'POST',
        headers: createAuthHeaders(),
        body: JSON.stringify({
          meetingId,
          userId,
          userName,
          ...dataToSave
        })
      });
      
      const savedNotes = await response.json();
      
      if (response.ok) {
        setNotes(savedNotes);
        setLastSaved(new Date());
        hasUnsavedChanges.current = false;
        return true;
      } else {
        setError(savedNotes.message || 'Failed to save notes');
        return false;
      }
    } catch (err) {
      setError('Network error while saving notes');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [meetingId, userId, userName, notes, createAuthHeaders]);

  // Auto-save with debouncing
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges.current && notes) {
        saveNotes();
      }
    }, autoSaveDelay);
  }, [saveNotes, autoSaveDelay, notes]);

  // Update notes content
  const updateContent = useCallback((content: string) => {
    if (!notes) {
      return;
    }
    
    setNotes(prev => prev ? { ...prev, content } : null);
    hasUnsavedChanges.current = true;
    scheduleAutoSave();
  }, [notes, scheduleAutoSave]);

  // Update notes title
  const updateTitle = useCallback((title: string) => {
    if (!notes) return;
    
    setNotes(prev => prev ? { ...prev, title } : null);
    hasUnsavedChanges.current = true;
    scheduleAutoSave();
  }, [notes, scheduleAutoSave]);

  // Toggle privacy
  const togglePrivacy = useCallback(() => {
    if (!notes) return;
    
    setNotes(prev => prev ? { ...prev, isPrivate: !prev.isPrivate } : null);
    hasUnsavedChanges.current = true;
    scheduleAutoSave();
  }, [notes, scheduleAutoSave]);

  // Force save
  const forceSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    return saveNotes();
  }, [saveNotes]);

  // Delete notes
  const deleteNotes = useCallback(async () => {
    if (!meetingId || !userId) return false;
    
    try {
      const response = await fetch(`/api/meeting-notes?meetingId=${meetingId}&userId=${userId}`, {
        method: 'DELETE',
        headers: createAuthHeaders()
      });
      
      if (response.ok) {
        setNotes(null);
        setLastSaved(null);
        hasUnsavedChanges.current = false;
        return true;
      }
      return false;
    } catch (err) {
      setError('Failed to delete notes');
      return false;
    }
  }, [meetingId, userId, createAuthHeaders]);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Save before unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = '';
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [forceSave]);

  return {
    notes,
    isLoading,
    isSaving,
    error,
    lastSaved,
    hasUnsavedChanges: hasUnsavedChanges.current,
    updateContent,
    updateTitle,
    togglePrivacy,
    saveNotes: forceSave,
    deleteNotes,
    loadNotes
  };
};
