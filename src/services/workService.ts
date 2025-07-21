import type { Work, WorkFile } from '@/types';

export interface WorkSubmissionData {
  sessionId: string;
  currentUserId: string;
  receiveUserId: string;
  workDescription: string;
  workFiles: { file: File; title: string }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export class WorkService {
  /**
   * ! Upload a single file and return the URL
   */
  static async uploadFile(file: File): Promise<string | null> {
    try {
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'work-submissions'); // Add folder for organization

      const response = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Upload response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        return null;
      }

      const data = await response.json();
      console.log('Upload response data:', data);
      
      if (data.url) {
        console.log('File upload successful, URL:', data.url);
        return data.url;
      } else {
        console.error('File upload failed:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  /**
   * Submit work with files to a session
   */
  static async submitWork(data: WorkSubmissionData): Promise<ApiResponse> {
    try {
      // Upload files first
      const uploadedFiles: WorkFile[] = [];
      
      console.log('Starting file upload process. Files to upload:', data.workFiles.length);
      
      for (const workFileItem of data.workFiles) {
        console.log('Processing file for upload:', workFileItem);
        console.log('File details:', {
          name: workFileItem.file.name,
          size: workFileItem.file.size,
          type: workFileItem.file.type,
          title: workFileItem.title
        });
        
        const fileUrl = await this.uploadFile(workFileItem.file);
        if (fileUrl) {
          console.log('File uploaded successfully:', fileUrl);
          const workFile = {
            fileURL: fileUrl,
            fileName: workFileItem.file.name,
            fileTitle: workFileItem.title,
            uploadedAt: new Date().toISOString(),
          };
          console.log('Adding work file to array:', workFile);
          uploadedFiles.push(workFile);
        } else {
          console.error('Failed to upload file:', workFileItem.file.name);
        }
      }

      console.log('Total files uploaded:', uploadedFiles.length);
      console.log('Final uploadedFiles array:', JSON.stringify(uploadedFiles, null, 2));

      // Submit work with uploaded file URLs
      const submissionPayload = {
        session: data.sessionId,
        provideUser: data.currentUserId,
        receiveUser: data.receiveUserId,
        workDescription: data.workDescription,
        workFiles: uploadedFiles,
        // Keep workURL for backwards compatibility, but prioritize workFiles
        workURL: uploadedFiles.length > 0 ? uploadedFiles[0].fileURL : 'text-only',
      };

      console.log('Submitting work payload:', submissionPayload);
      console.log('Uploaded files being sent:', uploadedFiles);
      console.log('workFiles array length:', uploadedFiles.length);

      const response = await fetch('/api/work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionPayload),
      });

      const result = await response.json();
      console.log('Work submission result:', result);
      return result;
    } catch (error) {
      console.error('Error submitting work:', error);
      return {
        success: false,
        message: 'Failed to submit work',
      };
    }
  }

  /**
   * Get all works for a session
   */
  static async getSessionWorks(sessionId: string): Promise<Work[]> {
    try {
      const response = await fetch(`/api/work/session/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.works;
      } else {
        console.error('Failed to fetch works:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching works:', error);
      return [];
    }
  }

  /**
   * Review a work submission (accept/reject)
   */
  static async reviewWork(
    workId: string, 
    action: 'accept' | 'reject', 
    message: string
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`/api/work/${workId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          message,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error reviewing work:', error);
      return {
        success: false,
        message: 'Failed to review work',
      };
    }
  }

  /**
   * Download a file using the file retrieve API
   */
  static async downloadFile(fileURL: string, fileName?: string): Promise<void> {
    try {
      console.log('Downloading file:', fileURL, 'with filename:', fileName);
      
      // Use the file retrieve API with the fileUrl parameter
      const downloadUrl = `/api/file/retrieve?fileUrl=${encodeURIComponent(fileURL)}`;
      
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }
}
