/**
 * MeetingBox Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MeetingBox from '@/components/messageSystem/MeetingBox';

// Mock child components
jest.mock('@/components/meetingSystem/CreateMeetingModal', () => {
  return function MockCreateMeetingModal({ onClose, onCreate, receiverName }: any) {
    return (
      <div data-testid="create-meeting-modal">
        <div>Create Meeting Modal for {receiverName}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onCreate({
          description: 'Test Meeting',
          date: '2025-07-20',
          time: '14:00'
        })}>Create Meeting</button>
      </div>
    );
  };
});

jest.mock('@/components/meetingSystem/CancelMeetingModal', () => {
  return function MockCancelMeetingModal({ meetingId, onClose, onCancel, userName }: any) {
    return (
      <div data-testid="cancel-meeting-modal">
        <div>Cancel Meeting Modal for {userName}</div>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onCancel(meetingId, 'Test cancellation reason')}>Cancel Meeting</button>
      </div>
    );
  };
});

jest.mock('@/components/meetingSystem/MeetingList', () => {
  return function MockMeetingList({ 
    pendingRequests, 
    upcomingMeetings, 
    onScheduleMeeting,
    onMeetingAction,
    onCancelMeeting
  }: any) {
    return (
      <div data-testid="meeting-list">
        <div data-testid="pending-requests-count">{pendingRequests.length}</div>
        <div data-testid="upcoming-meetings-count">{upcomingMeetings.length}</div>
        
        <button onClick={onScheduleMeeting} data-testid="schedule-meeting-btn">Schedule Meeting</button>
        
        {pendingRequests.map((meeting: any) => (
          <div key={meeting._id} data-testid={`pending-meeting-${meeting._id}`}>
            <button onClick={() => onMeetingAction(meeting._id, 'accept')}>Accept</button>
            <button onClick={() => onMeetingAction(meeting._id, 'reject')}>Reject</button>
          </div>
        ))}
        
        {upcomingMeetings.map((meeting: any) => (
          <div key={meeting._id} data-testid={`upcoming-meeting-${meeting._id}`}>
            <button onClick={() => onCancelMeeting(meeting._id)}>Cancel</button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('@/components/meetingSystem/SavedNotesList', () => {
  return function MockSavedNotesList({ notes }: any) {
    return (
      <div data-testid="saved-notes-list">
        <div data-testid="notes-count">{notes.length}</div>
      </div>
    );
  };
});

jest.mock('@/components/ui/Alert', () => {
  return function MockAlert({ isOpen, type, message, onClose }: any) {
    return isOpen ? (
      <div data-testid={`alert-${type}`}>
        <div data-testid="alert-message">{message}</div>
        <button onClick={onClose}>Close Alert</button>
      </div>
    ) : null;
  };
});

jest.mock('@/components/ui/ConfirmationDialog', () => {
  return function MockConfirmationDialog({ isOpen, title, onConfirm, onClose }: any) {
    return isOpen ? (
      <div data-testid="confirmation-dialog">
        <div data-testid="confirmation-title">{title}</div>
        <button onClick={onConfirm} data-testid="confirm-button">Confirm</button>
        <button onClick={onClose} data-testid="cancel-button">Cancel</button>
      </div>
    ) : null;
  };
});

// Mock API Services
const mockFetchMeetings = jest.fn();
const mockCreateMeeting = jest.fn();
const mockUpdateMeeting = jest.fn();
const mockCancelMeetingWithReason = jest.fn();
const mockFetchAllUserMeetingNotes = jest.fn();
const mockFilterMeetingsByType = jest.fn();
const mockCheckMeetingLimit = jest.fn();
const mockCanCancelMeeting = jest.fn();

jest.mock('@/services/meetingApiServices', () => ({
  fetchMeetings: (...args: any[]) => mockFetchMeetings(...args),
  createMeeting: (...args: any[]) => mockCreateMeeting(...args),
  updateMeeting: (...args: any[]) => mockUpdateMeeting(...args),
  cancelMeetingWithReason: (...args: any[]) => mockCancelMeetingWithReason(...args),
  fetchMeetingCancellation: jest.fn(),
  acknowledgeMeetingCancellation: jest.fn(),
  checkMeetingNotesExist: jest.fn().mockResolvedValue(false),
  fetchAllUserMeetingNotes: (...args: any[]) => mockFetchAllUserMeetingNotes(...args),
  downloadMeetingNotesFile: jest.fn(),
  filterMeetingsByType: (...args: any[]) => mockFilterMeetingsByType(...args),
  checkMeetingLimit: (...args: any[]) => mockCheckMeetingLimit(...args),
  canCancelMeeting: (...args: any[]) => mockCanCancelMeeting(...args),
}));

const mockFetchChatRoom = jest.fn();
const mockFetchUserProfile = jest.fn();

jest.mock('@/services/chatApiServices', () => ({
  fetchChatRoom: (...args: any[]) => mockFetchChatRoom(...args),
  fetchUserProfile: (...args: any[]) => mockFetchUserProfile(...args),
}));

jest.mock('@/services/sessionApiServices', () => ({
  invalidateUsersCaches: jest.fn(),
}));

jest.mock('@/services/debouncedApiService', () => ({
  debouncedApiService: {
    fetchUserProfile: jest.fn(),
    makeRequest: jest.fn(),
  },
}));

// Mock data
const mockChatRoom = {
  _id: 'chat-room-1',
  participants: ['user1', 'user2'],
  messages: []
};

const mockUserProfile = {
  _id: 'user2',
  firstName: 'John',
  lastName: 'Doe',
  avatar: '/avatar.png'
};

const mockMeetings = [
  {
    _id: 'meeting-1',
    description: 'Frontend Development Discussion',
    meetingTime: new Date('2025-07-20T14:00:00Z').toISOString(),
    state: 'pending',
    senderId: 'user2',
    receiverId: 'user1',
    createdAt: new Date('2025-07-18T10:00:00Z').toISOString()
  },
  {
    _id: 'meeting-2',
    description: 'Project Planning',
    meetingTime: new Date('2025-07-22T16:00:00Z').toISOString(),
    state: 'accepted',
    senderId: 'user1',
    receiverId: 'user2',
    createdAt: new Date('2025-07-17T10:00:00Z').toISOString()
  }
];

const mockFilteredMeetings = {
  pendingRequests: [mockMeetings[0]],
  upcomingMeetings: [mockMeetings[1]],
  pastMeetings: [],
  cancelledMeetings: []
};

const mockSavedNotes = [
  {
    _id: 'note-1',
    meetingId: 'meeting-3',
    title: 'Meeting Notes 1',
    content: 'Content of the first note',
    tags: ['development'],
    wordCount: 100,
    lastModified: new Date('2025-07-15T15:00:00Z').toISOString(),
    createdAt: new Date('2025-07-15T15:00:00Z').toISOString(),
    isPrivate: false
  }
];

// Default props
const defaultProps = {
  chatRoomId: 'chat-room-1',
  userId: 'user1',
  onClose: jest.fn(),
  onMeetingUpdate: jest.fn()
};

describe('MeetingBox Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFetchChatRoom.mockResolvedValue(mockChatRoom);
    mockFetchUserProfile.mockResolvedValue(mockUserProfile);
    mockFetchMeetings.mockResolvedValue(mockMeetings);
    mockFilterMeetingsByType.mockReturnValue(mockFilteredMeetings);
    mockFetchAllUserMeetingNotes.mockResolvedValue(mockSavedNotes);
    mockCanCancelMeeting.mockReturnValue({ canCancel: true, reason: null });
    mockCheckMeetingLimit.mockReturnValue(0);
  });

  describe('Rendering', () => {
    it('should render loading state initially', async () => {
      mockFetchMeetings.mockImplementation(() => new Promise(() => {})); // Never resolve
      
      render(<MeetingBox {...defaultProps} />);
      
      expect(screen.getByText('Loading meetings...')).toBeInTheDocument();
    });

    it('should render the main meeting interface after loading', async () => {
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Meetings')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
      expect(screen.getByTestId('meeting-list')).toBeInTheDocument();
    });

    it('should render saved notes section', async () => {
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/saved meeting notes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch chat room and meetings on mount', async () => {
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockFetchChatRoom).toHaveBeenCalledWith(defaultProps.chatRoomId);
      });
      
      // Give more time for fetchMeetings to be called
      await waitFor(() => {
        expect(mockFetchMeetings).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should fetch saved notes when component loads', async () => {
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockFetchAllUserMeetingNotes).toHaveBeenCalled();
      });
    });
  });

  describe('Meeting Management', () => {
    it('should open create meeting modal when new button is clicked', async () => {
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /new/i }));
      
      expect(screen.getByTestId('create-meeting-modal')).toBeInTheDocument();
    });

    it('should handle meeting creation', async () => {
      const newMeeting = {
        _id: 'new-meeting-id',
        description: 'Test Meeting',
        meetingTime: new Date('2025-07-20T14:00:00Z').toISOString(),
        state: 'pending',
        senderId: 'user1',
        receiverId: 'user2'
      };
      
      mockCreateMeeting.mockResolvedValue(newMeeting);

      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /new/i }));
      });
      
      fireEvent.click(screen.getByText('Create Meeting'));
      
      await waitFor(() => {
        expect(mockCreateMeeting).toHaveBeenCalledWith({
          senderId: 'user1',
          receiverId: 'user2',
          description: 'Test Meeting',
          meetingTime: expect.any(Date)
        });
      });
    });

    it('should handle meeting acceptance with confirmation', async () => {
      const updatedMeeting = {
        ...mockMeetings[0],
        state: 'accepted'
      };
      
      mockUpdateMeeting.mockResolvedValue(updatedMeeting);
      
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('meeting-list')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Accept'));
      
      // Should show confirmation dialog
      expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText('Accept Meeting')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('confirm-button'));
      
      await waitFor(() => {
        expect(mockUpdateMeeting).toHaveBeenCalledWith('meeting-1', 'accept');
      });
    });

    it('should handle meeting cancellation', async () => {
      const cancelledMeeting = {
        ...mockMeetings[1],
        state: 'cancelled'
      };
      
      mockCancelMeetingWithReason.mockResolvedValue(cancelledMeeting);
      
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('meeting-list')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(screen.getByTestId('cancel-meeting-modal')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Cancel Meeting'));
      
      await waitFor(() => {
        expect(mockCancelMeetingWithReason).toHaveBeenCalledWith('meeting-2', 'user1', 'Test cancellation reason');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error alert when meeting creation fails', async () => {
      mockCreateMeeting.mockRejectedValue(new Error('Failed to create meeting'));
      
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /new/i }));
      });
      
      fireEvent.click(screen.getByText('Create Meeting'));
      
      await waitFor(() => {
        expect(screen.getByTestId('alert-error')).toBeInTheDocument();
        expect(screen.getByText('Failed to create meeting')).toBeInTheDocument();
      });
    });
  });

  describe('Saved Notes', () => {
    it('should toggle saved notes section', async () => {
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/saved meeting notes/i)).toBeInTheDocument();
      });
      
      const toggleButton = screen.getByText(/saved meeting notes/i);
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('saved-notes-list')).toBeInTheDocument();
      });
    });
  });

  describe('Callback Functions', () => {
    it('should call onMeetingUpdate when meetings are loaded', async () => {
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(defaultProps.onMeetingUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty meetings list', async () => {
      mockFetchMeetings.mockResolvedValue([]);
      mockFilterMeetingsByType.mockReturnValue({
        pendingRequests: [],
        upcomingMeetings: [],
        pastMeetings: [],
        cancelledMeetings: []
      });
      
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('meeting-list')).toBeInTheDocument();
        expect(screen.getByTestId('pending-requests-count')).toHaveTextContent('0');
        expect(screen.getByTestId('upcoming-meetings-count')).toHaveTextContent('0');
      });
    });

    it('should handle meeting limit restriction', async () => {
      mockCheckMeetingLimit.mockReturnValue(2); // At limit
      
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /new/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
        // The exact text from the component
        expect(screen.getByText(/maximum of 2 active meetings/i)).toBeInTheDocument();
      });
    });

    it('should handle cancellation when meeting cannot be cancelled', async () => {
      mockCanCancelMeeting.mockReturnValue({ 
        canCancel: false, 
        reason: 'Meeting is too close to start time' 
      });
      
      render(<MeetingBox {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Cancel'));
      });
      
      expect(screen.getByTestId('alert-warning')).toBeInTheDocument();
      expect(screen.getByText('Meeting is too close to start time')).toBeInTheDocument();
    });
  });
});