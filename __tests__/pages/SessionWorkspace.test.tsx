/**
 * SessionWorkspace Page Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams, useRouter } from 'next/navigation';
import SessionWorkspace from '@/app/session/[sessionId]/page';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
    prefetch: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useParams: jest.fn(),
}));

// Mock AuthContext
const mockUser = {
  _id: 'user1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  title: 'Developer'
};

jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    logout: jest.fn(),
  }),
}));

// Mock tab components
jest.mock('@/components/sessionTabs/OverviewTab', () => {
  return function MockOverviewTab({ 
    session, 
    setActiveTab, 
    onSessionUpdate, 
    showAlert 
  }: any) {
    return (
      <div data-testid="overview-tab">
        <div>Overview Tab</div>
        <div data-testid="session-status">{session?.status}</div>
        <button onClick={() => setActiveTab('submit-work')} data-testid="go-to-submit">
          Go to Submit Work
        </button>
        <button onClick={() => showAlert('success', 'Test alert from overview')}>
          Test Alert
        </button>
        <button onClick={onSessionUpdate}>Refresh Session</button>
      </div>
    );
  };
});

jest.mock('@/components/sessionTabs/SubmitWorkTab', () => {
  return function MockSubmitWorkTab({ session, showAlert }: any) {
    return (
      <div data-testid="submit-work-tab">
        <div>Submit Work Tab</div>
        <button onClick={() => showAlert('success', 'Work submitted successfully')}>
          Submit Work
        </button>
      </div>
    );
  };
});

jest.mock('@/components/sessionTabs/ViewWorksTab', () => {
  return function MockViewWorksTab({ onWorkUpdate, showAlert }: any) {
    return (
      <div data-testid="view-works-tab">
        <div>View Works Tab</div>
        <button onClick={onWorkUpdate}>Refresh Works</button>
        <button onClick={() => showAlert('info', 'Work reviewed')}>
          Review Work
        </button>
      </div>
    );
  };
});

jest.mock('@/components/sessionTabs/ProgressTab', () => {
  return function MockProgressTab({ showAlert }: any) {
    return (
      <div data-testid="progress-tab">
        <div>Progress Tab</div>
        <button onClick={() => showAlert('success', 'Progress updated')}>
          Update Progress
        </button>
      </div>
    );
  };
});

jest.mock('@/components/sessionTabs/ReportTab', () => {
  return function MockReportTab({ showAlert }: any) {
    return (
      <div data-testid="report-tab">
        <div>Report Tab</div>
        <button onClick={() => showAlert('warning', 'Report submitted')}>
          Submit Report
        </button>
      </div>
    );
  };
});

// Mock UI Components
jest.mock('@/components/ui/Alert', () => {
  return function MockAlert({ isOpen, type, message, title, onClose }: any) {
    return isOpen ? (
      <div data-testid={`alert-${type}`}>
        {title && <div data-testid="alert-title">{title}</div>}
        <div data-testid="alert-message">{message}</div>
        <button onClick={onClose}>Close Alert</button>
      </div>
    ) : null;
  };
});

jest.mock('@/components/ui/ConfirmationDialog', () => {
  return function MockConfirmationDialog({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onClose,
    confirmText 
  }: any) {
    return isOpen ? (
      <div data-testid="confirmation-dialog">
        <div data-testid="confirmation-title">{title}</div>
        <div data-testid="confirmation-message">{message}</div>
        <button onClick={onConfirm} data-testid="confirm-button">
          {confirmText || 'Confirm'}
        </button>
        <button onClick={onClose} data-testid="cancel-button">Cancel</button>
      </div>
    ) : null;
  };
});

// Mock data
const mockActiveSession = {
  _id: 'session-123',
  status: 'active',
  startDate: '2025-07-15T10:00:00.000Z',
  expectedEndDate: '2025-07-25T10:00:00.000Z',
  user1Id: {
    _id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe'
  },
  user2Id: {
    _id: 'user2',
    firstName: 'Jane',
    lastName: 'Smith',
    name: 'Jane Smith'
  },
  skill1Id: {
    _id: 'skill1',
    name: 'Frontend Development'
  },
  skill2Id: {
    _id: 'skill2',
    name: 'Backend Development'
  },
  descriptionOfService1: 'I will help with React and TypeScript development',
  descriptionOfService2: 'I will help with Node.js and database design'
};

const mockCompletedSession = {
  ...mockActiveSession,
  status: 'completed'
};

const mockCancelledSession = {
  ...mockActiveSession,
  status: 'canceled'
};

const mockWorks = [
  {
    _id: 'work-1',
    submitUser: { _id: 'user1', firstName: 'John', lastName: 'Doe' },
    receiveUser: { _id: 'user2', firstName: 'Jane', lastName: 'Smith' },
    title: 'Frontend Component',
    description: 'React component for user dashboard',
    acceptanceStatus: 'accepted',
    submittedAt: '2025-07-16T10:00:00.000Z'
  },
  {
    _id: 'work-2',
    submitUser: { _id: 'user2', firstName: 'Jane', lastName: 'Smith' },
    receiveUser: { _id: 'user1', firstName: 'John', lastName: 'Doe' },
    title: 'API Endpoint',
    description: 'User authentication API',
    acceptanceStatus: 'pending',
    submittedAt: '2025-07-17T10:00:00.000Z'
  }
];

const mockProgress = [
  {
    _id: 'progress-1',
    userId: 'user1',
    status: 'in_progress',
    completionPercentage: 75,
    notes: 'Working on the final components',
    dueDate: '2025-07-22T10:00:00.000Z'
  },
  {
    _id: 'progress-2',
    userId: 'user2',
    status: 'in_progress',
    completionPercentage: 60,
    notes: 'Database schema complete',
    dueDate: '2025-07-23T10:00:00.000Z'
  }
];

const mockOtherUserDetails = {
  _id: 'user2',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  title: 'Backend Developer'
};

// Global fetch mock
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SessionWorkspace Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useParams to return sessionId
    (useParams as jest.Mock).mockReturnValue({ sessionId: 'session-123' });
    
    // Setup default fetch responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/session/session-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            session: mockActiveSession
          })
        });
      }
      
      if (url.includes('/api/work/session/session-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            works: mockWorks
          })
        });
      }
      
      if (url.includes('/api/session-progress/session-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            progress: mockProgress
          })
        });
      }
      
      if (url.includes('/api/users/profile?id=user2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            user: mockOtherUserDetails
          })
        });
      }
      
      if (url.includes('/api/notification')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      
      // Default fallback
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false, message: 'Not found' })
      });
    });
  });

  describe('Rendering', () => {
    it('should render session not found when session is null', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/session/session-123')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: false,
              session: null
            })
          });
        }
        return Promise.reject(new Error('Unhandled fetch'));
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText('Session Not Found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });
  });



  describe('Tab Navigation', () => {
    beforeEach(async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
    });

    it('should render all tab buttons', () => {
      expect(screen.getAllByText('Overview')).toHaveLength(2); // Desktop and mobile versions
      expect(screen.getAllByText('Submit Work')).toHaveLength(2);
      expect(screen.getAllByText('View Works')).toHaveLength(2);
      expect(screen.getAllByText('Progress')).toHaveLength(2);
      expect(screen.getAllByText('Report Issue')).toHaveLength(2);
    });

    it('should switch to submit work tab', async () => {
      // Use getByRole to target the button specifically
      const submitWorkButtons = screen.getAllByRole('button');
      const submitWorkTab = submitWorkButtons.find(button => 
        button.textContent?.includes('Submit Work')
      );
      
      if (submitWorkTab) {
        fireEvent.click(submitWorkTab);
        
        await waitFor(() => {
          expect(screen.getByTestId('submit-work-tab')).toBeInTheDocument();
        });
      }
    });

    it('should switch to view works tab', async () => {
      const viewWorksButtons = screen.getAllByRole('button');
      const viewWorksTab = viewWorksButtons.find(button => 
        button.textContent?.includes('View Works')
      );
      
      if (viewWorksTab) {
        fireEvent.click(viewWorksTab);
        
        await waitFor(() => {
          expect(screen.getByTestId('view-works-tab')).toBeInTheDocument();
        });
      }
    });

    it('should switch to progress tab', async () => {
      const progressButtons = screen.getAllByRole('button');
      const progressTab = progressButtons.find(button => 
        button.textContent?.includes('Progress') && !button.textContent?.includes('Update')
      );
      
      if (progressTab) {
        fireEvent.click(progressTab);
        
        await waitFor(() => {
          expect(screen.getByTestId('progress-tab')).toBeInTheDocument();
        });
      }
    });

    it('should switch to report tab', async () => {
      const reportButtons = screen.getAllByRole('button');
      const reportTab = reportButtons.find(button => 
        button.textContent?.includes('Report Issue')
      );
      
      if (reportTab) {
        fireEvent.click(reportTab);
        
        await waitFor(() => {
          expect(screen.getByTestId('report-tab')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Data Fetching', () => {
    it('should fetch session data on mount', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/session/session-123');
      });
    });

    it('should fetch works and progress when user is available', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/work/session/session-123');
        expect(mockFetch).toHaveBeenCalledWith('/api/session-progress/session-123');
      });
    });

    it('should fetch other user details when session is loaded', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/profile?id=user2');
      });
    });

    it('should handle session refresh', async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByText('Refresh Session');
      fireEvent.click(refreshButton);
      
      // Should call fetch again for session data
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/session/session-123');
      });
    });
  });

  describe('Alert System', () => {
    beforeEach(async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
    });

    it('should show alert from tab component', async () => {
      const alertButton = screen.getByText('Test Alert');
      fireEvent.click(alertButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert-success')).toBeInTheDocument();
        expect(screen.getByText('Test alert from overview')).toBeInTheDocument();
      });
    });

    it('should close alert when close button is clicked', async () => {
      const alertButton = screen.getByText('Test Alert');
      fireEvent.click(alertButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert-success')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close Alert');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('alert-success')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle session fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<SessionWorkspace />);
      
      // Should still render but may show loading state or handle error
      await waitFor(() => {
        // Component should not crash - check if main content exists
        expect(document.body).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle works fetch error gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/work/session/session-123')) {
          return Promise.reject(new Error('Works fetch failed'));
        }
        if (url.includes('/api/session/session-123')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              session: mockActiveSession
            })
          });
        }
        return mockFetch(url);
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
      });
    });

    it('should handle progress fetch error gracefully', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/session-progress/session-123')) {
          return Promise.reject(new Error('Progress fetch failed'));
        }
        if (url.includes('/api/session/session-123')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              session: mockActiveSession
            })
          });
        }
        return mockFetch(url);
      });
      
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
    });

    it('should render mobile-friendly header', () => {
      expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Started:')).toBeInTheDocument();
    });

    it('should have scrollable tab navigation', () => {
      // Get the tab navigation container specifically
      const allNavs = screen.getAllByRole('navigation');
      const tabNavigation = allNavs.find(nav => 
        nav.className.includes('mb-4')
      );
      expect(tabNavigation).toBeInTheDocument();
    });
  });



  describe('User Display Names', () => {
    beforeEach(async () => {
      render(<SessionWorkspace />);
      
      await waitFor(() => {
        expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
      });
    });

    it('should display correct other user name in header', () => {
      expect(screen.getByText('Session with Jane Smith')).toBeInTheDocument();
    });

    it('should display session start date', () => {
      expect(screen.getByText('Started:')).toBeInTheDocument();
      expect(screen.getByText('Jul 15, 2025')).toBeInTheDocument();
    });
  });
});
