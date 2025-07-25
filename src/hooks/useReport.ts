import { useState, useCallback, useEffect } from 'react';
import { reportService, type ReportFile, type ExistingReport, type ReportData } from '@/services/reportService';
import type { Session } from '@/types';

interface UseReportProps {
  session: Session | null;
  currentUserId: string | undefined;
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  user?: any;
}

export const useReport = ({ session, currentUserId, showAlert, user }: UseReportProps) => {
  // Form state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportFiles, setReportFiles] = useState<ReportFile[]>([]);
  const [submittingReport, setSubmittingReport] = useState(false);
  
  // Data state
  const [existingReports, setExistingReports] = useState<ExistingReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Validation state
  const [formErrors, setFormErrors] = useState<{
    reason?: string;
    description?: string;
    files?: string;
  }>({});

  /**
   * Fetch existing reports
   */
  const fetchReports = useCallback(async () => {
    if (!currentUserId || !session?._id) return;
    
    setLoadingReports(true);
    try {
      const reports = await reportService.fetchReports(session._id, currentUserId);
      setExistingReports(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      showAlert('error', 'Failed to load existing reports');
    } finally {
      setLoadingReports(false);
    }
  }, [currentUserId, session?._id, showAlert]);

  /**
   * Load reports on mount
   */
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setReportReason('');
    setReportDescription('');
    setReportFiles([]);
    setFormErrors({});
    setShowReportForm(false);
  }, []);

  /**
   * Check if current user has already submitted a report for this session
   */
  const hasUserAlreadyReported = useCallback((): boolean => {
    if (!currentUserId || !existingReports) return false;
    
    return existingReports.some(report => {
      const reportedById = typeof report.reportedBy === 'object' ? report.reportedBy._id : report.reportedBy;
      return reportedById === currentUserId;
    });
  }, [currentUserId, existingReports]);

  /**
   * Validate form data
   */
  const validateForm = useCallback((): boolean => {
    const errors: typeof formErrors = {};

    // Check if user has already submitted a report
    if (hasUserAlreadyReported()) {
      errors.reason = 'You have already submitted a report for this session';
      setFormErrors(errors);
      return false;
    }

    if (!reportReason.trim()) {
      errors.reason = 'Please select a reason for the report';
    }

    if (!reportDescription.trim()) {
      errors.description = 'Please provide a description of the issue';
    } else if (reportDescription.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }

    // Check for any file upload errors
    const fileErrors = reportFiles.filter(rf => rf.error);
    if (fileErrors.length > 0) {
      errors.files = 'Please resolve file upload errors before submitting';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [reportReason, reportDescription, reportFiles, hasUserAlreadyReported]);

  /**
   * Handle file addition
   */
  const handleFileAdd = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check total file limit
    if (reportFiles.length + files.length > 5) {
      showAlert('warning', 'You can upload a maximum of 5 files');
      return;
    }

    // Validate each file and create ReportFile objects
    const newReportFiles: ReportFile[] = files.map(file => {
      const validation = reportService.validateFile(file);
      return {
        file,
        uploading: false,
        uploaded: false,
        error: validation.valid ? undefined : validation.error
      };
    });

    setReportFiles(prev => [...prev, ...newReportFiles]);

    // Start uploading valid files
    newReportFiles.forEach(async (reportFile, index) => {
      if (!reportFile.error && session?._id) {
        const fileIndex = reportFiles.length + index;
        
        // Set uploading state
        setReportFiles(prev => prev.map((rf, i) => 
          i === fileIndex ? { ...rf, uploading: true } : rf
        ));

        try {
          const url = await reportService.uploadFile(reportFile.file, session._id);
          
          // Update with success
          setReportFiles(prev => prev.map((rf, i) => 
            i === fileIndex ? { 
              ...rf, 
              uploading: false, 
              uploaded: true, 
              url 
            } : rf
          ));
        } catch (error) {
          // Update with error
          setReportFiles(prev => prev.map((rf, i) => 
            i === fileIndex ? { 
              ...rf, 
              uploading: false, 
              uploaded: false, 
              error: error instanceof Error ? error.message : 'Upload failed'
            } : rf
          ));
        }
      }
    });

    // Clear the input
    e.target.value = '';
  }, [reportFiles.length, session?._id, showAlert]);

  /**
   * Handle file removal
   */
  const handleFileRemove = useCallback((index: number) => {
    setReportFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Submit report
   */
  const handleSubmit = useCallback(async () => {
    if (!session || !currentUserId) {
      showAlert('error', 'Session or user information is missing');
      return;
    }

    // Check if user has already submitted a report
    if (hasUserAlreadyReported()) {
      showAlert('warning', 'You have already submitted a report for this session. Only one report per user is allowed per session.');
      return;
    }

    if (!validateForm()) {
      showAlert('warning', 'Please fix the form errors before submitting');
      return;
    }

    // Check if any files are still uploading
    const uploadingFiles = reportFiles.filter(rf => rf.uploading);
    if (uploadingFiles.length > 0) {
      showAlert('warning', 'Please wait for file uploads to complete');
      return;
    }

    setSubmittingReport(true);

    try {
      // Get the other user ID
      const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
      
      console.log('Report submission data:', {
        sessionId: session._id,
        currentUserId,
        otherUserId,
        reportReason,
        reportDescription,
        reportFiles: reportFiles.length
      });

      // Prepare report data
      const reportData: ReportData = {
        sessionId: session._id,
        reportedBy: currentUserId,           // Current user making the report
        reportedUser: otherUserId,           // User being reported
        reason: reportReason,                // Changed from reportReason to reason
        description: reportDescription,
        evidenceFiles: reportFiles          // Changed from fileUrls to evidenceFiles
          .filter(rf => rf.uploaded && rf.url)
          .map(rf => rf.url!)
      };

      console.log('Final report data to be sent:', reportData);

      // Submit the report
      await reportService.submitReport(reportData);

      // Send notification to the reported user
      const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Someone';
      await reportService.sendReportNotification(otherUserId, currentUserName, session._id);

      // Success feedback
      showAlert('success', 'Report submitted successfully. Our team will review it shortly.');
      
      // Reset form and refresh reports
      resetForm();
      await fetchReports();

    } catch (error) {
      console.error('Error submitting report:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  }, [
    session, 
    currentUserId, 
    hasUserAlreadyReported,
    validateForm, 
    reportFiles, 
    reportReason, 
    reportDescription, 
    user, 
    showAlert, 
    resetForm, 
    fetchReports
  ]);

  /**
   * Get progress statistics
   */
  const getReportStats = useCallback(() => {
    const totalFiles = reportFiles.length;
    const uploadedFiles = reportFiles.filter(rf => rf.uploaded).length;
    const uploadingFiles = reportFiles.filter(rf => rf.uploading).length;
    const failedFiles = reportFiles.filter(rf => rf.error).length;

    return {
      totalFiles,
      uploadedFiles,
      uploadingFiles,
      failedFiles,
      canSubmit: totalFiles === 0 || (uploadedFiles + failedFiles === totalFiles && uploadingFiles === 0)
    };
  }, [reportFiles]);

  return {
    // Form state
    showReportForm,
    setShowReportForm,
    reportReason,
    setReportReason,
    reportDescription,
    setReportDescription,
    reportFiles,
    submittingReport,
    
    // Data state
    existingReports,
    loadingReports,
    
    // Validation
    formErrors,
    hasUserAlreadyReported,
    
    // Actions
    handleFileAdd,
    handleFileRemove,
    handleSubmit,
    resetForm,
    fetchReports,
    
    // Utilities
    getReportStats,
    formatFileSize: reportService.formatFileSize,
  };
};
