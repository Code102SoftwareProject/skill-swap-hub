import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import NotificationPage from '@/app/user/notification/page';
import { useAuth } from '@/lib/context/AuthContext';
import { useSocket } from '@/lib/context/SocketContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/context/SocketContext', () => ({
  useSocket: jest.fn(),
}));

jest.mock('@/components/homepage/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>;
  };
});

jest.mock('@/components/notificationSystem/NotificationAlert', () => {
  return function MockNotificationAlert() {
    return <div data-testid="notification-alert">Notification Alert</div>;
  };
});

jest.mock('@/components/notificationSystem/Notification', () => {
  return function MockNotification({ notification, onMarkAsRead }: any) {
    return (
      <div data-testid={`notification-${notification._id}`} className="notification-item">
        <div>{notification.description}</div>
        <div>Type: {notification.typename}</div>
        <div>Read: {notification.isRead ? 'Yes' : 'No'}</div>
        <button 
          onClick={() => onMarkAsRead(notification._id)}
          data-testid={`mark-read-${notification._id}`}
        >
          Mark as Read
        </button>
      </div>
    );
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('NotificationPage', () => {
  const mockPush = jest.fn();
  const mockUser = {
    _id: 'test-user-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  };
  const mockToken = 'mock-token';
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
  };

  const mockNotifications = [
    {
      _id: 'notif-1',
      typename: 'Work Submitted',
      color: '#006699',
      description: 'New work has been submitted for your review',
      createdAt: '2025-07-13T10:00:00Z',
      isRead: false,
      targetDestination: '/session/123'
    },
    {
      _id: 'notif-2',
      typename: 'Session Update',
      color: '#00AA33',
      description: 'Your session progress has been updated',
      createdAt: '2025-07-12T15:30:00Z',
      isRead: true,
      targetDestination: '/session/456'
    },
    {
      _id: 'notif-3',
      typename: 'Message',
      color: '#FF6600',
      description: 'You have a new message',
      createdAt: '2025-07-11T09:15:00Z',
      isRead: false,
      targetDestination: '/messages'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      token: mockToken,
      isLoading: false,
    });

    (useSocket as jest.Mock).mockReturnValue({
      socket: mockSocket,
      isConnected: true,
    });

    // Default successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        notifications: mockNotifications
      }),
    });
  });

  describe('Authentication and Loading', () => {
    it('should show loading state while auth is loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        token: null,
        isLoading: true,
      });

      render(<NotificationPage />);

      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('notification-alert')).toBeInTheDocument();
    });

    it('should redirect to login when not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        token: null,
        isLoading: false,
      });

      render(<NotificationPage />);

      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/user/notification');
    });

    it('should show error when user ID is missing', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        token: mockToken,
        isLoading: false,
      });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Could not identify user. Please log in again.')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Fetching', () => {
    it('should fetch and display notifications successfully', async () => {
      render(<NotificationPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/notification?userId=${mockUser._id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${mockToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Hi John, here are your notifications:')).toBeInTheDocument();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('2 unread')).toBeInTheDocument();
      });

      // Check unread notifications section
      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screen.getByTestId('notification-notif-3')).toBeInTheDocument();

      // Check read notifications section
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByTestId('notification-notif-2')).toBeInTheDocument();
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should handle unsuccessful API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          message: 'Failed to fetch notifications'
        }),
      });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort notifications by newest first by default', async () => {
      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
      });

      const notifications = screen.getAllByTestId(/^notification-notif-/);
      expect(notifications[0]).toHaveAttribute('data-testid', 'notification-notif-1'); // July 13
      expect(notifications[1]).toHaveAttribute('data-testid', 'notification-notif-3'); // July 11
    });

    it('should sort notifications by oldest first when selected', async () => {
      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
      });

      const sortSelect = screen.getByDisplayValue('Newest First');
      fireEvent.change(sortSelect, { target: { value: 'oldest' } });

      expect(screen.getByDisplayValue('Oldest First')).toBeInTheDocument();
    });
  });

  describe('Mark as Read Functionality', () => {
    it('should mark individual notification as read', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, notifications: mockNotifications })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      });

      const markReadButton = screen.getByTestId('mark-read-notif-1');
      fireEvent.click(markReadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/notification/read', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ notificationId: 'notif-1' })
        });
      });
    });

    it('should revert read status if API call fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, notifications: mockNotifications })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      });

      const markReadButton = screen.getByTestId('mark-read-notif-1');
      fireEvent.click(markReadButton);

      // The component should revert the read status on API failure
      await waitFor(() => {
        expect(screen.getByText('Read: No')).toBeInTheDocument();
      });
    });

    it('should mark all notifications as read', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, notifications: mockNotifications })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Mark all as read')).toBeInTheDocument();
      });

      const markAllReadButton = screen.getByText('Mark all as read');
      fireEvent.click(markAllReadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/notification/read-all?userId=${mockUser._id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${mockToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      });
    });

    it('should revert all notifications if mark all as read fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, notifications: mockNotifications })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Mark all as read')).toBeInTheDocument();
      });

      const markAllReadButton = screen.getByText('Mark all as read');
      fireEvent.click(markAllReadButton);

      // Should revert to original state on failure
      await waitFor(() => {
        expect(screen.getByText('2 unread')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Socket Notifications', () => {
    it('should set up socket listeners for new notifications', async () => {
      render(<NotificationPage />);

      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalledWith('receive_notification', expect.any(Function));
      });
    });

    it('should add new notification from socket', async () => {
      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('2 unread')).toBeInTheDocument();
      });

      // Simulate receiving a new notification via socket
      const socketCallback = mockSocket.on.mock.calls.find(call => call[0] === 'receive_notification')[1];
      
      await act(async () => {
        socketCallback({
          _id: 'new-notif-1',
          type: 'New Message',
          color: '#FF0000',
          description: 'You have a new urgent message',
          createdAt: new Date().toISOString(),
          targetDestination: '/messages/urgent'
        });
      });

      await waitFor(() => {
        expect(screen.getByText('3 unread')).toBeInTheDocument();
        expect(screen.getByText('You have a new urgent message')).toBeInTheDocument();
      });
    });

    it('should prevent duplicate notifications from socket', async () => {
      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('2 unread')).toBeInTheDocument();
      });

      const socketCallback = mockSocket.on.mock.calls.find(call => call[0] === 'receive_notification')[1];
      
      // Send the same notification twice
      const duplicateNotif = {
        _id: 'duplicate-notif',
        type: 'Duplicate',
        description: 'This should only appear once',
        createdAt: new Date().toISOString()
      };

      await act(async () => {
        socketCallback(duplicateNotif);
        socketCallback(duplicateNotif);
      });

      const duplicateElements = screen.getAllByText('This should only appear once');
      expect(duplicateElements).toHaveLength(1);
    });

    it('should clean up socket listeners on unmount', () => {
      const { unmount } = render(<NotificationPage />);
      
      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith('receive_notification', expect.any(Function));
    });

    it('should handle socket not being connected', () => {
      (useSocket as jest.Mock).mockReturnValue({
        socket: null,
        isConnected: false,
      });

      render(<NotificationPage />);

      // Should not crash and should not call socket methods
      expect(mockSocket.on).not.toHaveBeenCalled();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no notifications exist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          notifications: []
        }),
      });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('You have no notifications yet')).toBeInTheDocument();
      });
    });

    it('should show all caught up message when all notifications are read', async () => {
      const allReadNotifications = mockNotifications.map(notif => ({ ...notif, isRead: true }));
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          notifications: allReadNotifications
        }),
      });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText("You're all caught up! No unread notifications.")).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    it('should hide sort dropdown when no notifications exist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          notifications: []
        }),
      });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Newest First')).not.toBeInTheDocument();
      });
    });

    it('should hide mark all as read button when no unread notifications', async () => {
      const allReadNotifications = mockNotifications.map(notif => ({ ...notif, isRead: true }));
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          notifications: allReadNotifications
        }),
      });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
      });
    });

    it('should show correct unread count in badge', async () => {
      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('2 unread')).toBeInTheDocument();
      });
    });

    it('should display user greeting with first name', async () => {
      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Hi John, here are your notifications:')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during individual mark as read', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, notifications: mockNotifications })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-notif-1')).toBeInTheDocument();
      });

      const markReadButton = screen.getByTestId('mark-read-notif-1');
      fireEvent.click(markReadButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to mark notification as read:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle network errors during mark all as read', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, notifications: mockNotifications })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Mark all as read')).toBeInTheDocument();
      });

      const markAllReadButton = screen.getByText('Mark all as read');
      fireEvent.click(markAllReadButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to mark all notifications as read:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      render(<NotificationPage />);

      await waitFor(() => {
        expect(screen.getByText('HTTP error! status: 400')).toBeInTheDocument();
      });
    });
  });
});
