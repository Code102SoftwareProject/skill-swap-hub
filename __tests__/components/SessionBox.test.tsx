/**
 * SessionBox Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionBox from '@/components/messageSystem/SessionBox';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock child components
jest.mock('@/components/sessionSystem/CreateSessionModal', () => {
  return function MockCreateSessionModal({ isOpen, onClose, otherUserName }: any) {
    return isOpen ? (
      <div data-testid="create-session-modal">
        <div>Create Session Modal for {otherUserName}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock('@/components/sessionSystem/EditSessionModal', () => {
  return function MockEditSessionModal({ isOpen, onClose }: any) {
    return isOpen ? (
      <div data-testid="edit-session-modal">
        <div>Edit Session Modal</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock('@/components/sessionSystem/CounterOfferModal', () => {
  return function MockCounterOfferModal({ isOpen, onClose }: any) {
    return isOpen ? (
      <div data-testid="counter-offer-modal">
        <div>Counter Offer Modal</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock('@/components/ui/Alert', () => {
  return function MockAlert({ isOpen, type, message, onClose }: any) {
    return isOpen ? (
      <div data-testid={`alert-${type}`}>
        <div>{message}</div>
        <button onClick={onClose}>Close Alert</button>
      </div>
    ) : null;
  };
});

jest.mock('@/components/ui/ConfirmationDialog', () => {
  return function MockConfirmationDialog({ isOpen, title, message, onConfirm, onClose }: any) {
    return isOpen ? (
      <div data-testid="confirmation-dialog">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null;
  };
});

// Mock utility functions
jest.mock('@/services/sessionApiServices', () => ({
  invalidateUsersCaches: jest.fn(),
}));

jest.mock('@/utils/avatarUtils', () => ({
  processAvatarUrl: jest.fn((url) => url || '/default-avatar.png'),
}));

// Mock data
const mockUser = {
  _id: '6873cc50ac4e1d6e1cddf33f',
  firstName: 'Adeepa',
  lastName: 'Test',
  email: 'webservicesbyadeepa@gmail.com',
  avatar: '/avatar.png',
  title: 'Web Developer'
};

const mockOtherUser = {
  _id: 'other-user-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  avatar: '/john-avatar.png',
  title: 'Frontend Developer'
};

const mockSession = {
  _id: 'session-id-1',
  user1Id: mockUser,
  user2Id: mockOtherUser,
  skill1Id: { _id: 'skill1', name: 'React' },
  skill2Id: { _id: 'skill2', name: 'Node.js' },
  descriptionOfService1: 'I can teach React basics',
  descriptionOfService2: 'I want to learn Node.js',
  startDate: '2025-01-15',
  expectedEndDate: '2025-02-15',
  isAccepted: null,
  isAmmended: false,
  status: 'pending',
  createdAt: '2025-01-01T10:00:00Z'
};

const mockCompletedSession = {
  ...mockSession,
  _id: 'session-id-2',
  status: 'completed',
  isAccepted: true
};

const mockRejectedSession = {
  ...mockSession,
  _id: 'session-id-3',
  status: 'rejected',
  isAccepted: false,
  rejectedBy: mockOtherUser,
  rejectedAt: '2025-01-02T10:00:00Z'
};

// Mock fetch responses
const createMockFetch = (responses: Record<string, any>) => {
  return jest.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const urlObj = new URL(url, 'http://localhost');
    const path = urlObj.pathname;
    
    // User fetch
    if (path.includes('/api/users/')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          user: mockOtherUser
        }),
        ok: true,
        status: 200
      } as Response);
    }
    
    // Sessions fetch
    if (path.includes('/api/session/between-users')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          sessions: responses.sessions || []
        }),
        ok: true,
        status: 200
      } as Response);
    }
    
    // Counter offers fetch
    if (path.includes('/api/session/counter-offer') && !path.includes('/api/session/counter-offer/')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          counterOffers: responses.counterOffers || []
        }),
        ok: true,
        status: 200
      } as Response);
    }
    
    return Promise.resolve({
      json: () => Promise.resolve({ success: true }),
      ok: true,
      status: 200
    } as Response);
  }) as jest.MockedFunction<typeof fetch>;
};

describe('SessionBox Component', () => {
  const defaultProps = {
    chatRoomId: 'chat-room-1',
    userId: '6873cc50ac4e1d6e1cddf33f',
    otherUserId: 'other-user-id',
    onSessionUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = createMockFetch({});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should show New Session button', async () => {
      global.fetch = createMockFetch({ sessions: [] });
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('New Session')).toBeInTheDocument();
      });
    });

    it('should show empty state when no sessions exist', async () => {
      global.fetch = createMockFetch({ sessions: [] });
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No Sessions Yet')).toBeInTheDocument();
        expect(screen.getByText(/Start your first skill swap session with/)).toBeInTheDocument();
      });
    });
  });

  describe('Sessions Display', () => {
    it('should display pending sessions correctly', async () => {
      global.fetch = createMockFetch({ 
        sessions: [mockSession],
        counterOffers: []
      });
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('I can teach React basics')).toBeInTheDocument();
        expect(screen.getByText('I want to learn Node.js')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });

    it('should show correct pending session count', async () => {
      const multiplePendingSessions = [
        { ...mockSession, _id: 'session-1' },
        { ...mockSession, _id: 'session-2' },
        { ...mockSession, _id: 'session-3' }
      ];
      
      global.fetch = createMockFetch({ 
        sessions: multiplePendingSessions,
        counterOffers: []
      });
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('3/3')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should open create session modal when New Session button is clicked', async () => {
      global.fetch = createMockFetch({ sessions: [] });
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Session'));
      });
      
      expect(screen.getByTestId('create-session-modal')).toBeInTheDocument();
      expect(screen.getByText('Create Session Modal for John Doe')).toBeInTheDocument();
    });

    it('should disable New Session button when 3 pending sessions exist', async () => {
      const multiplePendingSessions = [
        { ...mockSession, _id: 'session-1' },
        { ...mockSession, _id: 'session-2' },
        { ...mockSession, _id: 'session-3' }
      ];
      
      global.fetch = createMockFetch({ 
        sessions: multiplePendingSessions,
        counterOffers: []
      });
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        const newSessionButton = screen.getByText('New Session').closest('button');
        expect(newSessionButton).toBeDisabled();
        expect(newSessionButton).toHaveClass('cursor-not-allowed');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle failed user fetch', async () => {
      global.fetch = jest.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/users/')) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: false, message: 'User not found' }),
            ok: false,
            status: 404
          } as Response);
        }
        return Promise.resolve({
          json: () => Promise.resolve({ success: true }),
          ok: true,
          status: 200
        } as Response);
      }) as jest.MockedFunction<typeof fetch>;
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load user information')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) => 
        Promise.reject(new Error('Network error'))
      ) as jest.MockedFunction<typeof fetch>;
      
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error fetching user:'),
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Modal Interactions', () => {
    it('should close create session modal when close button is clicked', async () => {
      global.fetch = createMockFetch({ sessions: [] });
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('New Session'));
      });
      
      expect(screen.getByTestId('create-session-modal')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Close'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('create-session-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', async () => {
      global.fetch = createMockFetch({ 
        sessions: [mockSession],
        counterOffers: []
      });
      
      render(<SessionBox {...defaultProps} />);
      
      await waitFor(() => {
        // Check if the formatted date appears (Jan 15, 2025)
        expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
      });
    });
  });
});
