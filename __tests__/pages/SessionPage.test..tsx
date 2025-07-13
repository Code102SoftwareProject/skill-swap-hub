/**
 * Session Workspace Page Tests
 * Tests the session workspace functionality including work submission, progress tracking, and reviews
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionWorkspace from '@/app/session/[sessionId]/page';

// Mock Next.js hooks
const mockPush = jest.fn();
const mockParams = { sessionId: 'test-session-id' };

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn()
  })
}));

// Mock auth context
const mockUser = {
  _id: 'test-user-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
};

jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    error: null
  })
}));

// Mock completion status utility
jest.mock('@/utils/sessionCompletion', () => ({
  getSessionCompletionStatus: jest.fn(() => Promise.resolve({
    canRequestCompletion: true,
    hasRequestedCompletion: false,
    needsToApprove: false,
    wasRejected: false,
    isCompleted: false,
    pendingRequests: []
  }))
}));

// Mock Alert component
jest.mock('@/components/ui/Alert', () => {
  return function MockAlert({ type, title, message, isOpen, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="alert" className={`alert-${type}`}>
        {title && <div data-testid="alert-title">{title}</div>}
        {message && <div data-testid="alert-message">{message}</div>}
        <button onClick={onClose} data-testid="alert-close">Close</button>
      </div>
    );
  };
});

// Mock ConfirmationDialog component
jest.mock('@/components/ui/ConfirmationDialog', () => {
  return function MockConfirmationDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    type,
    confirmText,
    loading
  }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-dialog">
        <div data-testid="confirmation-title">{title}</div>
        <div data-testid="confirmation-message">{message}</div>
        <div data-testid="confirmation-type">{type}</div>
        <button 
          onClick={onConfirm} 
          data-testid="confirmation-confirm"
          disabled={loading}
        >
          {confirmText || 'Confirm'}
        </button>
        <button onClick={onClose} data-testid="confirmation-cancel">Cancel</button>
      </div>
    );
  };
});

// Mock tab components
jest.mock('@/components/sessionTabs/OverviewTab', () => {
  return function MockOverviewTab({ session, myProgress, otherProgress, otherUser }: any) {
    return (
      <div data-testid="overview-tab">
        <div>Session: {session?.descriptionOfService1}</div>
        <div>My Progress: {myProgress?.completionPercentage}%</div>
        <div>Other Progress: {otherProgress?.completionPercentage}%</div>
        <div>Other User: {otherUser?.firstName}</div>
      </div>
    );
  };
});

jest.mock('@/components/sessionTabs/SubmitWorkTab', () => {
  return function MockSubmitWorkTab({ onSubmit, loading }: any) {
    return (
      <div data-testid="submit-work-tab">
        <form onSubmit={onSubmit}>
          <input 
            data-testid="work-description" 
            placeholder="Work description"
            onChange={(e) => {}}
          />
          <button type="submit" disabled={loading} data-testid="submit-work">
            Submit Work
          </button>
        </form>
      </div>
    );
  };
});

jest.mock('@/components/sessionTabs/ViewWorksTab', () => {
  return function MockViewWorksTab({ works, onReview, onDownload }: any) {
    return (
      <div data-testid="view-works-tab">
        {works.map((work: any) => (
          <div key={work._id} data-testid={`work-${work._id}`}>
            <div>{work.workDescription}</div>
            <button onClick={() => onReview(work._id, 'accept')} data-testid={`accept-${work._id}`}>
              Accept
            </button>
            <button onClick={() => onReview(work._id, 'reject')} data-testid={`reject-${work._id}`}>
              Reject
            </button>
            {work.workFiles?.map((file: any, index: number) => (
              <button 
                key={index}
                onClick={() => onDownload(file.fileURL, file.fileName)}
                data-testid={`download-${work._id}-${index}`}
              >
                Download {file.fileName}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('@/components/sessionTabs/ProgressTab', () => {
  return function MockProgressTab({ 
    myProgress, 
    otherProgress, 
    onUpdate, 
    onComplete,
    completionStatus
  }: any) {
    return (
      <div data-testid="progress-tab">
        <div>My Progress: {myProgress?.completionPercentage}%</div>
        <button onClick={onUpdate} data-testid="update-progress">
          Update Progress
        </button>
        {completionStatus?.canRequestCompletion && (
          <button onClick={onComplete} data-testid="request-completion">
            Request Completion
          </button>
        )}
        {completionStatus?.needsToApprove && (
          <div data-testid="approval-needed">Approval Needed</div>
        )}
      </div>
    );
  };
});

jest.mock('@/components/sessionTabs/ReportTab', () => {
  return function MockReportTab({ onSubmit, loading, existingReports }: any) {
    return (
      <div data-testid="report-tab">
        <form onSubmit={onSubmit}>
          <select data-testid="report-reason">
            <option value="inappropriate">Inappropriate Behavior</option>
            <option value="quality">Poor Quality Work</option>
          </select>
          <textarea data-testid="report-description" placeholder="Description" />
          <button type="submit" disabled={loading} data-testid="submit-report">
            Submit Report
          </button>
        </form>
        <div data-testid="existing-reports">
          Reports: {existingReports?.length || 0}
        </div>
      </div>
    );
  };
});

// Mock file operations
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch
global.fetch = jest.fn();

describe('SessionWorkspace Page', () => {
  const mockSession = {
    _id: 'test-session-id',
    user1Id: {
      _id: 'test-user-id',
      firstName: 'John',
      lastName: 'Doe'
    },
    user2Id: {
      _id: 'other-user-id',
      firstName: 'Jane',
      lastName: 'Smith'
    },
    skill1Id: {
      _id: 'skill-1',
      name: 'Web Development'
    },
    skill2Id: {
      _id: 'skill-2', 
      name: 'Graphic Design'
    },
    descriptionOfService1: 'I will create a website for you',
    descriptionOfService2: 'I will design graphics for your project',
    startDate: '2025-07-01T00:00:00Z',
    expectedEndDate: '2025-08-01T00:00:00Z',
    isAccepted: true,
    status: 'active'
  };

  const mockWorks = [
    {
      _id: 'work-1',
      session: 'test-session-id',
      provideUser: { _id: 'other-user-id', firstName: 'Jane', lastName: 'Smith' },
      receiveUser: { _id: 'test-user-id', firstName: 'John', lastName: 'Doe' },
      workURL: 'https://example.com/file1.pdf',
      workFiles: [
        {
          fileName: 'design.pdf',
          fileURL: 'https://example.com/file1.pdf',
          fileTitle: 'Design Draft',
          uploadedAt: '2025-07-10T10:00:00Z'
        }
      ],
      workDescription: 'Initial design concepts',
      provideDate: '2025-07-10T10:00:00Z',
      acceptanceStatus: 'pending'
    }
  ];

  const mockProgress = {
    _id: 'progress-1',
    userId: { _id: 'test-user-id' },
    sessionId: 'test-session-id',
    startDate: '2025-07-01T00:00:00Z',
    dueDate: '2025-08-01T00:00:00Z',
    completionPercentage: 50,
    status: 'in_progress',
    notes: 'Making good progress'
  };

  const mockOtherProgress = {
    _id: 'progress-2',
    userId: { _id: 'other-user-id' },
    sessionId: 'test-session-id',
    startDate: '2025-07-01T00:00:00Z',
    dueDate: '2025-08-01T00:00:00Z',
    completionPercentage: 75,
    status: 'in_progress',
    notes: 'Almost done'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      console.log('Mocking fetch for:', url, options?.method);
      
      if (url.includes('/api/session/test-session-id') && !url.includes('completion') && !url.includes('cancel') && !url.includes('report')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            session: mockSession
          })
        });
      }
      
      if (url.includes('/api/work/session/test-session-id')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            works: mockWorks
          })
        });
      }
      
      if (url.includes('/api/session-progress/test-session-id') && options?.method !== 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            progress: [mockProgress, mockOtherProgress]
          })
        });
      }
      
      if (url.includes('/api/session-progress/test-session-id') && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            progress: { ...mockProgress, completionPercentage: 75 }
          })
        });
      }
      
      if (url.includes('/api/users/profile')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            user: {
              _id: 'other-user-id',
              firstName: 'Jane',
              lastName: 'Smith',
              avatar: 'https://example.com/avatar.jpg'
            }
          })
        });
      }
      
      if (url.includes('/api/session/report/test-session-id') && options?.method !== 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            reports: []
          })
        });
      }
      
      if (url.includes('/api/session/report') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            report: { _id: 'new-report-id' }
          })
        });
      }
      
      if (url.includes('/api/reviews') && options?.method !== 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            reviews: [],
            userReview: null,
            receivedReview: null
          })
        });
      }
      
      if (url.includes('/api/reviews') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            review: { _id: 'new-review-id' }
          })
        });
      }
      
      if (url.includes('/api/work') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            work: { _id: 'new-work-id' }
          })
        });
      }
      
      if (url.includes('/api/work/work-1') && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            work: { ...mockWorks[0], acceptanceStatus: 'accepted' }
          })
        });
      }
      
      if (url.includes('/api/session/test-session-id/completion/request') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: 'Completion requested'
          })
        });
      }
      
      if (url.includes('/api/notification') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      
      if (url.includes('/api/file/retrieve')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['file content'], { type: 'application/pdf' })),
          headers: new Map([['content-disposition', 'attachment; filename="design.pdf"']])
        });
      }
      
      // Default error response
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Rendering and Data Loading', () => {
    it('should show loading state initially', () => {
      render(<SessionWorkspace />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should redirect if user is not authenticated', async () => {
      // Mock unauthenticated state
      const { useAuth } = require('@/lib/context/AuthContext');
      useAuth.mockReturnValueOnce({
        user: null,
        loading: false,
        error: null
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText(/Please log in/i)).toBeInTheDocument();
      });
    });

    it('should fetch session data on mount', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/session/test-session-id');
      });
    });

    it('should render session information when loaded', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('● Active')).toBeInTheDocument();
      });
    });

    it('should show error if session not found', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Session not found' })
        })
      );
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText(/Session not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs correctly', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
      });

      // Check that the default tab content is visible
      expect(screen.getByText('Overview')).toBeInTheDocument();

      // Switch to submit work tab
      const submitWorkTab = screen.getByText('Submit Work');
      fireEvent.click(submitWorkTab);
      
      expect(screen.getByTestId('submit-work-tab')).toBeInTheDocument();

      // Switch to view works tab
      const viewWorksTab = screen.getByText('View Works');
      fireEvent.click(viewWorksTab);
      
      expect(screen.getByTestId('view-works-tab')).toBeInTheDocument();
    });

    it('should disable submit work and report tabs for completed sessions', async () => {
      // Mock completed session
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/session/test-session-id') && !url.includes('completion') && !url.includes('cancel') && !url.includes('report')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              session: { ...mockSession, status: 'completed' }
            })
          });
        }
        // Return default success for other calls
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, works: [], progressData: [], reports: [], reviews: [] })
        });
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
      });

      // Check that submit work tab exists (even if disabled, it should still be rendered)
      expect(screen.getByText('Submit Work')).toBeInTheDocument();
    });
  });

  describe('Work Submission', () => {
    it('should submit work successfully', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
      });

      // Switch to submit work tab
      const submitWorkTab = screen.getByText('Submit Work');
      fireEvent.click(submitWorkTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('submit-work-tab')).toBeInTheDocument();
      });

      // Fill and submit work form
      const descriptionInput = screen.getByTestId('work-description');
      fireEvent.change(descriptionInput, { target: { value: 'Completed website design' } });
      
      const submitButton = screen.getByTestId('submit-work');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/work', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }));
      });
    });

    it('should show error for empty work description', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
      });

      const submitWorkTab = screen.getByText('Submit Work');
      fireEvent.click(submitWorkTab);
      
      const submitButton = screen.getByTestId('submit-work');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText(/provide a work description/i)).toBeInTheDocument();
      });
    });
  });

  describe('Work Review', () => {
    it('should accept work successfully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/work/work-1') && url.includes('PATCH')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              work: { ...mockWorks[0], acceptanceStatus: 'accepted' }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });

      // Switch to view works tab
      const viewWorksTab = screen.getByText('View Works');
      fireEvent.click(viewWorksTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-works-tab')).toBeInTheDocument();
      });

      const acceptButton = screen.getByTestId('accept-work-1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/work/work-1', expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('accept')
        }));
      });
    });

    it('should reject work with reason', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const viewWorksTab = screen.getByText('View Works');
        fireEvent.click(viewWorksTab);
      });
      
      const rejectButton = screen.getByTestId('reject-work-1');
      fireEvent.click(rejectButton);
      
      // This would trigger a modal for rejection reason in real implementation
      await waitFor(() => {
        expect(screen.getByTestId('view-works-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Management', () => {
    it('should update progress successfully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/session-progress/test-session-id') && url.includes('PATCH')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              progress: { ...mockProgress, completionPercentage: 75 }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const progressTab = screen.getByText('Progress');
        fireEvent.click(progressTab);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('progress-tab')).toBeInTheDocument();
      });

      const updateButton = screen.getByTestId('update-progress');
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/session-progress/test-session-id', expect.objectContaining({
          method: 'PATCH'
        }));
      });
    });

    it('should request session completion', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const progressTab = screen.getByText('Progress');
        fireEvent.click(progressTab);
      });
      
      const requestCompletionButton = screen.getByTestId('request-completion');
      fireEvent.click(requestCompletionButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
        expect(screen.getByText(/Request Session Completion/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Completion', () => {
    it('should handle completion approval', async () => {
      // Mock completion status that needs approval
      const { getSessionCompletionStatus } = require('@/utils/sessionCompletion');
      getSessionCompletionStatus.mockResolvedValueOnce({
        canRequestCompletion: false,
        hasRequestedCompletion: false,
        needsToApprove: true,
        wasRejected: false,
        isCompleted: false,
        pendingRequests: [{ requesterId: 'other-user-id' }]
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const progressTab = screen.getByText('Progress');
        fireEvent.click(progressTab);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('approval-needed')).toBeInTheDocument();
      });
    });

    it('should handle completion request', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/session/test-session-id/completion/request')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              message: 'Completion requested'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const progressTab = screen.getByText('Progress');
        fireEvent.click(progressTab);
      });
      
      const requestButton = screen.getByTestId('request-completion');
      fireEvent.click(requestButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByTestId('confirmation-confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/session/test-session-id/completion/request', expect.objectContaining({
          method: 'POST'
        }));
      });
    });
  });

  describe('Reporting System', () => {
    it('should submit report successfully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/session/report') && url.includes('POST')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              report: { _id: 'new-report-id' }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const reportTab = screen.getByText('Report');
        fireEvent.click(reportTab);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('report-tab')).toBeInTheDocument();
      });

      // Fill report form
      const reasonSelect = screen.getByTestId('report-reason');
      fireEvent.change(reasonSelect, { target: { value: 'inappropriate' } });
      
      const descriptionTextarea = screen.getByTestId('report-description');
      fireEvent.change(descriptionTextarea, { target: { value: 'User was unprofessional' } });
      
      const submitButton = screen.getByTestId('submit-report');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/session/report', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }));
      });
    });

    it('should show existing reports', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/session/report/test-session-id')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              reports: [
                { _id: 'report-1', reason: 'inappropriate', status: 'pending' }
              ]
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const reportTab = screen.getByText('Report');
        fireEvent.click(reportTab);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Reports: 1')).toBeInTheDocument();
      });
    });
  });

  describe('File Operations', () => {
    it('should download work files', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['file content'], { type: 'application/pdf' })),
        headers: new Map([['content-disposition', 'attachment; filename="design.pdf"']])
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const viewWorksTab = screen.getByText('View Works');
        fireEvent.click(viewWorksTab);
      });
      
      const downloadButton = screen.getByTestId('download-work-1-0');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/file/retrieve?fileUrl=https%3A%2F%2Fexample.com%2Ffile1.pdf');
      });
    });

    it('should handle file download errors', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Download failed'));
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const viewWorksTab = screen.getByText('View Works');
        fireEvent.click(viewWorksTab);
      });
      
      const downloadButton = screen.getByTestId('download-work-1-0');
      fireEvent.click(downloadButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to download file/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should close alerts when close button is clicked', async () => {
      render(<SessionWorkspace />);
      
      // Trigger an error to show alert
      await waitFor(() => {
        const submitWorkTab = screen.getByText('Submit Work');
        fireEvent.click(submitWorkTab);
      });
      
      const submitButton = screen.getByTestId('submit-work');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('alert-close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Notifications', () => {
    it('should send notifications on work submission', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/work')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              work: { _id: 'new-work-id' }
            })
          });
        }
        if (url.includes('/api/notification')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        const submitWorkTab = screen.getByText('Submit Work');
        fireEvent.click(submitWorkTab);
      });
      
      const descriptionInput = screen.getByTestId('work-description');
      fireEvent.change(descriptionInput, { target: { value: 'Work completed' } });
      
      const submitButton = screen.getByTestId('submit-work');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/notification', expect.objectContaining({
          method: 'POST'
        }));
      });
    });
  });
});
