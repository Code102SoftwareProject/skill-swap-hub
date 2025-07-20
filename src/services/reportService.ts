import type { Session } from '@/types';
import { createSystemApiHeaders } from '@/utils/systemApiAuth';

export interface ReportData {
  sessionId: string;
  reportedBy: string;      // Current user who is making the report
  reportedUser: string;    // User being reported
  reason: string;
  description: string;
  evidenceFiles?: string[]; // Changed from fileUrls to evidenceFiles
}

export interface ReportFile {
  file: File;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export interface ExistingReport {
  _id: string;
  sessionId: string;
  reportedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;      // Can be populated object or just ID string
  reportedUser: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;    // Can be populated object or just ID string
  reason: string;
  description: string;
  evidenceFiles: string[]; // Changed from fileUrls to evidenceFiles
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

class ReportService {
  /**
   * Create authorization headers for API calls
   */
  private createAuthHeaders(token: string, isFormData: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  /**
   * Map user-friendly reason labels to database enum values
   */
  private reasonEnumMap: Record<string, string> = {
    'inappropriate_behavior': 'Inappropriate Behavior',
    'not_following_session_terms': 'Not Following Agreed Terms', 
    'not_responsive': 'Communication Issues',
    'poor_quality_work': 'Quality of Work',
    'not_submitting_work': 'No Show/Not Submitting Work',
    'other': 'Other'
  };

  /**
   * Get user-friendly display text for reason enum value
   */
  getReasonDisplayText(enumValue: string): string {
    return this.reasonEnumMap[enumValue] || enumValue;
  }

  /**
   * Validate reason enum value
   */
  private validateReason(reason: string): boolean {
    const validReasons = [
      'not_submitting_work',
      'not_responsive', 
      'poor_quality_work',
      'inappropriate_behavior',
      'not_following_session_terms',
      'other'
    ];
    return validReasons.includes(reason);
  }
  /**
   * Fetch existing reports for a session and user
   */
  async fetchReports(sessionId: string, userId: string, token: string): Promise<ExistingReport[]> {
    const response = await fetch(`/api/session/report/${sessionId}?userId=${userId}`, {
      headers: this.createAuthHeaders(token),
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch reports');
    }
    
    return data.reports || [];
  }

  /**
   * Upload a file for report attachment
   */
  async uploadFile(file: File, sessionId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', `sessions/${sessionId}/reports`);

    const response = await fetch('/api/file/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    
    return data.url;
  }

  /**
   * Submit a new report
   */
  async submitReport(reportData: ReportData, token: string): Promise<void> {
    console.log('Submitting report with data:', reportData);
    
    // Validate reason enum value
    if (!this.validateReason(reportData.reason)) {
      throw new Error(`Invalid reason: ${reportData.reason}. Must be one of the predefined enum values.`);
    }
    
    const response = await fetch('/api/session/report', {
      method: 'POST',
      headers: this.createAuthHeaders(token),
      body: JSON.stringify(reportData),
    });

    const data = await response.json();
    console.log('Report submission response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit report');
    }
  }

  /**
   * Send notification after report submission
   */
  async sendReportNotification(
    reportedUserId: string, 
    reporterName: string, 
    sessionId: string
  ): Promise<void> {
    try {
      await fetch('/api/notification', {
        method: 'POST',
        headers: createSystemApiHeaders(),
        body: JSON.stringify({
          userId: reportedUserId,
          typeno: 21, // REPORT_SUBMITTED
          description: `${reporterName} has submitted a report regarding your session`,
          targetDestination: `/session/${sessionId}`,
          broadcast: false
        }),
      });
    } catch (error) {
      console.error('Error sending report notification:', error);
      // Don't throw error - notifications should not break the main functionality
    }
  }

  /**
   * Get formatted file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate file for upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload images, PDFs, or documents.'
      };
    }

    return { valid: true };
  }
}

export const reportService = new ReportService();
