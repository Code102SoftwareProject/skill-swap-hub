/**
 * MeetingBox Component Tests
 * Tests the meeting management functionality including scheduling, accepting, and cancelling meetings
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MeetingBox from '@/components/messageSystem/MeetingBox';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock meeting API services
jest.mock('@/services/meetingApiServices', () => ({
  fetchMeetings: jest.fn(),
  createMeeting: jest.fn(),
  updateMeeting: jest.fn()
}));

// Mock session API services for cache invalidation
jest.mock('@/services/sessionApiServices', () => ({
  invalidateUsersCaches: jest.fn()
}));

// Mock debounced API service
jest.mock('@/services/debouncedApiService', () => {
  const mockService = {
    makeRequest: jest.fn(),
    invalidate: jest.fn()
  };
  return {
    debouncedApiService: mockService,
    makeRequest: mockService.makeRequest,
    invalidate: mockService.invalidate
  };
});

// Mock utility functions
jest.mock('@/utils/avatarUtils', () => ({
  processAvatarUrl: jest.fn((url) => url),
  getFirstLetter: jest.fn((firstName, userId) => firstName?.[0] || 'U'),
  createFallbackAvatar: jest.fn(() => 'data:image/svg+xml;base64,mock')
}));

// Mock OptimizedAvatar component
jest.mock('@/components/ui/OptimizedAvatar', () => {
  return function MockOptimizedAvatar({ userId, firstName, lastName }: any) {
    return (
      <div data-testid="optimized-avatar">
        Avatar for {firstName} {lastName} ({userId})
      </div>
    );
  };
});

// Mock Alert component
jest.mock('@/components/ui/Alert', () => {
  return function MockAlert({ type, title, message, isOpen, onClose }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="alert" className={`alert-${type}`}>
        {title && <div data-testid="alert-title">{title}</div>}
        <div data-testid="alert-message">{message}</div>
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
    confirmText 
  }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-dialog">
        <div data-testid="confirmation-title">{title}</div>
        <div data-testid="confirmation-message">{message}</div>
        <div data-testid="confirmation-type">{type}</div>
        <button onClick={onConfirm} data-testid="confirmation-confirm">
          {confirmText || 'Confirm'}
        </button>
        <button onClick={onClose} data-testid="confirmation-cancel">Cancel</button>
      </div>
    );
  };
});

// Mock CreateMeetingModal component
jest.mock('@/components/meetingSystem/CreateMeetingModal', () => {
  return function MockCreateMeetingModal({ onClose, onCreate, receiverName }: any) {
    return (
      <div data-testid="create-meeting-modal">
        <div>Creating meeting with {receiverName}</div>
        <button 
          onClick={() => onCreate({
            description: 'Test meeting description',
            date: '2025-07-15',
            time: '10:00'
          })}
          data-testid="create-meeting-submit"
        >
          Create Meeting
        </button>
        <button onClick={onClose} data-testid="create-meeting-cancel">Cancel</button>
      </div>
    );
  };
});

// Mock CancelMeetingModal component
jest.mock('@/components/meetingSystem/CancelMeetingModal', () => {
  return function MockCancelMeetingModal({ meetingId, onClose, onCancel, userName }: any) {
    return (
      <div data-testid="cancel-meeting-modal">
        <div>Cancelling meeting for {userName}</div>
        <button 
          onClick={() => onCancel(meetingId, 'Test cancellation reason')}
          data-testid="cancel-meeting-submit"
        >
          Cancel Meeting
        </button>
        <button onClick={onClose} data-testid="cancel-meeting-close">Close</button>
      </div>
    );
  };
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock URL.createObjectURL for notes download
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

describe('MeetingBox Component', () => {
  const mockProps = {
    chatRoomId: '6873cdd898892472c9621cf1',
    userId: '6873cc50ac4e1d6e1cddf33f',
    onClose: jest.fn(),
    onMeetingUpdate: jest.fn()
  };

  const mockMeetings = [
    {
      _id: 'meeting-1',
      senderId: 'other-user-id', // Other user is sender
      receiverId: '6873cc50ac4e1d6e1cddf33f', // Test user is receiver
      description: 'Test meeting 1',
      meetingTime: '2025-07-20T10:00:00Z',
      state: 'pending',
      acceptStatus: false,
      meetingLink: null
    },
    {
      _id: 'meeting-2',
      senderId: 'other-user-id',
      receiverId: '6873cc50ac4e1d6e1cddf33f',
      description: 'Test meeting 2',
      meetingTime: '2025-07-25T14:00:00Z',
      state: 'accepted',
      acceptStatus: true,
      meetingLink: 'https://meet.example.com/room123'
    },
    {
      _id: 'meeting-3',
      senderId: '6873cc50ac4e1d6e1cddf33f',
      receiverId: 'other-user-id',
      description: 'Past meeting',
      meetingTime: '2025-07-10T10:00:00Z',
      state: 'completed',
      acceptStatus: true,
      meetingLink: null
    }
  ];

  const mockChatRoom = {
    _id: '6873cdd898892472c9621cf1',
    participants: ['6873cc50ac4e1d6e1cddf33f', 'other-user-id']
  };

  const mockUserProfile = {
    _id: 'other-user-id',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg'
  };

  // Get the mocked functions
  const mockFetchMeetings = require('@/services/meetingApiServices').fetchMeetings as jest.MockedFunction<any>;
  const mockCreateMeeting = require('@/services/meetingApiServices').createMeeting as jest.MockedFunction<any>;
  const mockUpdateMeeting = require('@/services/meetingApiServices').updateMeeting as jest.MockedFunction<any>;
  const mockInvalidateUsersCaches = require('@/services/sessionApiServices').invalidateUsersCaches as jest.MockedFunction<any>;
  const mockMakeRequest = require('@/services/debouncedApiService').debouncedApiService.makeRequest as jest.MockedFunction<any>;
  const mockInvalidate = require('@/services/debouncedApiService').debouncedApiService.invalidate as jest.MockedFunction<any>;
  const mockRouter = require('next/navigation').useRouter();
  const mockPush = mockRouter.push as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock chat room fetch
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/chatrooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            chatRooms: [mockChatRoom]
          })
        });
      }
      
      if (url.includes('/api/users/profile')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            user: mockUserProfile
          })
        });
      }

      if (url.includes('/api/meeting/cancel')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            meeting: { ...mockMeetings[0], state: 'cancelled' }
          })
        });
      }

      if (url.includes('/api/meeting-notes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            _id: 'notes-1',
            content: 'Test meeting notes content',
            title: 'Meeting Notes',
            userName: 'Test User',
            createdAt: '2025-07-10T10:00:00Z'
          })
        });
      }
      
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });

    // Mock API services
    mockFetchMeetings.mockResolvedValue(mockMeetings);
    mockCreateMeeting.mockResolvedValue({
      _id: 'new-meeting-id',
      senderId: '6873cc50ac4e1d6e1cddf33f',
      receiverId: 'other-user-id',
      description: 'New test meeting',
      meetingTime: '2025-07-30T15:00:00Z',
      state: 'pending'
    });
    mockUpdateMeeting.mockResolvedValue({
      ...mockMeetings[0],
      state: 'accepted'
    });

    // Mock debounced API service
    mockMakeRequest.mockImplementation((key: string, fn: () => any) => fn());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the meeting box with header and schedule button', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Meetings')).toBeInTheDocument();
        expect(screen.getByText('New')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<MeetingBox {...mockProps} />);
      
      expect(screen.getByText('Loading meetings...')).toBeInTheDocument();
    });

    it('should fetch chat room data and meetings on mount', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/chatrooms?chatRoomId=6873cdd898892472c9621cf1')
        );
        expect(mockFetchMeetings).toHaveBeenCalledWith(
          '6873cc50ac4e1d6e1cddf33f',
          'other-user-id'
        );
      });
    });
  });

  describe('Meeting Display and Categorization', () => {
    it('should categorize and display meetings correctly', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      // Should show different meeting categories
      expect(screen.getByText('Pending Requests (1)')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Meetings (1)')).toBeInTheDocument();
    });

    it('should show empty state when no meetings exist', async () => {
      mockFetchMeetings.mockResolvedValueOnce([]);
      
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No meetings scheduled')).toBeInTheDocument();
        expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
      });
    });
  });

  describe('Meeting Creation', () => {
    it('should open create meeting modal when schedule button is clicked', async () => {
      // Use meetings with no active count to allow modal opening
      mockFetchMeetings.mockResolvedValueOnce([mockMeetings[2]]); // Only past meeting
      
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const scheduleButton = screen.getByText('New');
      
      act(() => {
        fireEvent.click(scheduleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('create-meeting-modal')).toBeInTheDocument();
      });
    });

    it('should create a new meeting successfully', async () => {
      // Use meetings with no active count to allow modal opening
      mockFetchMeetings.mockResolvedValueOnce([mockMeetings[2]]); // Only past meeting
      
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      // Open create modal
      const scheduleButton = screen.getByText('New');
      
      act(() => {
        fireEvent.click(scheduleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('create-meeting-modal')).toBeInTheDocument();
      });

      // Submit meeting creation
      const createButton = screen.getByTestId('create-meeting-submit');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockCreateMeeting).toHaveBeenCalledWith({
          senderId: '6873cc50ac4e1d6e1cddf33f',
          receiverId: 'other-user-id',
          description: 'Test meeting description',
          meetingTime: new Date('2025-07-15T10:00')
        });
      });
    });

    it('should show error when meeting limit is reached', async () => {
      // Mock meetings with 2 active meetings
      const activeMeetings = [
        { ...mockMeetings[0], state: 'pending' },
        { ...mockMeetings[1], state: 'accepted', meetingTime: '2025-07-30T10:00:00Z' }
      ];
      mockFetchMeetings.mockResolvedValueOnce(activeMeetings);
      
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const scheduleButton = screen.getByText('New');
      fireEvent.click(scheduleButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText('Meeting Limit Reached')).toBeInTheDocument();
      });
    });
  });

  describe('Meeting Actions', () => {
    it('should accept a meeting request', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      // Find and click accept button for pending meeting
      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);
      
      // Confirm the action
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByTestId('confirmation-confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockUpdateMeeting).toHaveBeenCalledWith('meeting-1', 'accept');
      });
    });

    it('should decline a meeting request', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const declineButton = screen.getByText('Decline');
      fireEvent.click(declineButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
        expect(screen.getByText('Decline Meeting')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByTestId('confirmation-confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockUpdateMeeting).toHaveBeenCalledWith('meeting-1', 'reject');
      });
    });

    it('should cancel a meeting with reason', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      // Find cancel button (should be on upcoming meeting)
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('cancel-meeting-modal')).toBeInTheDocument();
      });
      
      const submitCancelButton = screen.getByTestId('cancel-meeting-submit');
      fireEvent.click(submitCancelButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/meeting/cancel', 
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('meeting-2')
          })
        );
      });
    });
  });

  describe('Meeting Navigation', () => {
    it('should navigate to meeting room when join button is clicked', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const joinButton = screen.getByText('Join Meeting');
      fireEvent.click(joinButton);
      
      expect(mockPush).toHaveBeenCalledWith('/meeting/meeting-2');
    });
  });

  describe('Meeting Notes Functionality', () => {
    it('should download meeting notes for completed meetings', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      // Click on past meetings to see download option
      const pastMeetingsButton = screen.getByText('Past Meetings (1)');
      fireEvent.click(pastMeetingsButton);
      
      await waitFor(() => {
        const downloadButton = screen.getByText('Download Notes');
        fireEvent.click(downloadButton);
      });

      // Verify notes API was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/meeting-notes?meetingId=meeting-3')
        );
      });
    });
  });

  describe('View Toggles', () => {
    it('should toggle past meetings view', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const pastMeetingsButton = screen.getByText('Past Meetings (1)');
      fireEvent.click(pastMeetingsButton);
      
      // Should show past meetings section
      expect(screen.getByText('Past meeting')).toBeInTheDocument();
    });

    it('should toggle cancelled meetings view', async () => {
      // Add a cancelled meeting to the mock data
      const meetingsWithCancelled = [
        ...mockMeetings,
        {
          _id: 'meeting-4',
          senderId: '6873cc50ac4e1d6e1cddf33f',
          receiverId: 'other-user-id',
          description: 'Cancelled meeting',
          meetingTime: '2025-07-18T10:00:00Z',
          state: 'cancelled',
          acceptStatus: false,
          meetingLink: null
        }
      ];
      mockFetchMeetings.mockResolvedValueOnce(meetingsWithCancelled);
      
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const cancelledMeetingsButton = screen.getByText('Cancelled Meetings (1)');
      fireEvent.click(cancelledMeetingsButton);
      
      expect(screen.getByText('Cancelled meeting')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle meeting creation errors', async () => {
      mockCreateMeeting.mockRejectedValueOnce(new Error('Failed to create meeting'));
      // Use meetings with no active count to allow modal opening
      mockFetchMeetings.mockResolvedValueOnce([mockMeetings[2]]); // Only past meeting
      
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const scheduleButton = screen.getByText('New');
      
      act(() => {
        fireEvent.click(scheduleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('create-meeting-modal')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('create-meeting-submit');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to create meeting')).toBeInTheDocument();
      });
    });

    it('should handle meeting update errors', async () => {
      mockUpdateMeeting.mockRejectedValueOnce(new Error('Update failed'));
      
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByTestId('confirmation-confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to accept meeting')).toBeInTheDocument();
      });
    });
  });

  describe('Component Cleanup', () => {
    it('should call onMeetingUpdate when meetings change', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(mockProps.onMeetingUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Alert and Confirmation Management', () => {
    it('should close alert when close button is clicked', async () => {
      mockCreateMeeting.mockRejectedValueOnce(new Error('Test error'));
      // Use meetings with no active count to allow modal opening
      mockFetchMeetings.mockResolvedValueOnce([mockMeetings[2]]); // Only past meeting
      
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      // Trigger an error to show alert
      const scheduleButton = screen.getByText('New');
      
      act(() => {
        fireEvent.click(scheduleButton);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('create-meeting-modal')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('create-meeting-submit');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      const closeAlertButton = screen.getByTestId('alert-close');
      fireEvent.click(closeAlertButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
      });
    });

    it('should close confirmation dialog when cancel is clicked', async () => {
      render(<MeetingBox {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading meetings...')).not.toBeInTheDocument();
      });

      const acceptButton = screen.getByText('Accept');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByTestId('confirmation-cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
      });
    });
  });
});
