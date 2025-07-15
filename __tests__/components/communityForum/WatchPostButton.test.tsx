/**
 * WatchPostButton Component Tests
 * Tests the post watching/bookmarking functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WatchPostButton from '@/components/communityForum/WatchPostButton';

// Mock AuthContext
const mockUser = {
  _id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  avatar: '/avatar.jpg'
};

jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  }),
}));

// Mock User Preferences Hook
const mockIsPostWatched = jest.fn();
const mockToggleWatchPost = jest.fn();

jest.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({
    isPostWatched: mockIsPostWatched,
    toggleWatchPost: mockToggleWatchPost,
    trackInteraction: jest.fn(),
    getPersonalizedFeed: jest.fn()
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe('WatchPostButton Component', () => {
  const defaultProps = {
    postId: 'post-123',
    className: '',
    showText: true,
    size: 'md' as const,
    onStatusChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPostWatched.mockReturnValue(false);
    mockToggleWatchPost.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render watch button when user is authenticated', () => {
      render(<WatchPostButton {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Watch')).toBeInTheDocument();
    });

    it('should not render when user is not authenticated', () => {
      jest.mocked(require('@/lib/context/AuthContext').useAuth).mockReturnValue({
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });
      
      const { container } = render(<WatchPostButton {...defaultProps} />);
      
      expect(container).toBeEmptyDOMElement();
    });

    it('should show watched state when post is already watched', () => {
      mockIsPostWatched.mockReturnValue(true);
      
      render(<WatchPostButton {...defaultProps} />);
      
      expect(screen.getByText('Watching')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('should show unwatched state when post is not watched', () => {
      mockIsPostWatched.mockReturnValue(false);
      
      render(<WatchPostButton {...defaultProps} />);
      
      expect(screen.getByText('Watch')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('should hide text when showText is false', () => {
      render(<WatchPostButton {...defaultProps} showText={false} />);
      
      expect(screen.queryByText('Watch')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      render(<WatchPostButton {...defaultProps} size="sm" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('should apply medium size classes', () => {
      render(<WatchPostButton {...defaultProps} size="md" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should apply large size classes', () => {
      render(<WatchPostButton {...defaultProps} size="lg" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-base');
    });
  });

  describe('Watch/Unwatch Functionality', () => {
    it('should call toggleWatchPost with watch action when clicked and not watched', async () => {
      mockIsPostWatched.mockReturnValue(false);
      
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockToggleWatchPost).toHaveBeenCalledWith('post-123', 'watch');
      });
    });

    it('should call toggleWatchPost with unwatch action when clicked and already watched', async () => {
      mockIsPostWatched.mockReturnValue(true);
      
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockToggleWatchPost).toHaveBeenCalledWith('post-123', 'unwatch');
      });
    });

    it('should call onStatusChange callback after successful toggle', async () => {
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(defaultProps.onStatusChange).toHaveBeenCalled();
      });
    });

    it('should not call onStatusChange when callback is not provided', async () => {
      const { onStatusChange, ...propsWithoutCallback } = defaultProps;
      
      render(<WatchPostButton {...propsWithoutCallback} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockToggleWatchPost).toHaveBeenCalled();
      });
      
      // No error should be thrown when callback is not provided
    });

    it('should prevent event propagation when clicked', async () => {
      const mockParentClick = jest.fn();
      
      render(
        <div onClick={mockParentClick}>
          <WatchPostButton {...defaultProps} />
        </div>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockParentClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable button during loading', async () => {
      mockToggleWatchPost.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(button).toBeDisabled();
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should show loading text during operation', async () => {
      mockToggleWatchPost.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Watch')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle toggle errors gracefully', async () => {
      mockToggleWatchPost.mockRejectedValue(new Error('Network error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error toggling watch status:',
          expect.any(Error)
        );
      });
      
      // Button should be re-enabled after error
      expect(button).not.toBeDisabled();
      
      consoleSpy.mockRestore();
    });

    it('should maintain original state on error', async () => {
      mockIsPostWatched.mockReturnValue(false);
      mockToggleWatchPost.mockRejectedValue(new Error('Network error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<WatchPostButton {...defaultProps} />);
      
      expect(screen.getByText('Watch')).toBeInTheDocument();
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Watch')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Tooltip Functionality', () => {
    it('should show tooltip on hover', async () => {
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByText(/watch this post/i)).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByText(/watch this post/i)).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(button);
      
      await waitFor(() => {
        expect(screen.queryByText(/watch this post/i)).not.toBeInTheDocument();
      });
    });

    it('should show different tooltip text when watched', async () => {
      mockIsPostWatched.mockReturnValue(true);
      
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      await waitFor(() => {
        expect(screen.getByText(/stop watching/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('should indicate current state to screen readers', () => {
      mockIsPostWatched.mockReturnValue(true);
      
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should handle keyboard activation', async () => {
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(mockToggleWatchPost).toHaveBeenCalled();
      });
    });

    it('should handle space key activation', async () => {
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ' });
      
      await waitFor(() => {
        expect(mockToggleWatchPost).toHaveBeenCalled();
      });
    });
  });

  describe('Visual States', () => {
    it('should show bookmark icon when not watched', () => {
      mockIsPostWatched.mockReturnValue(false);
      
      render(<WatchPostButton {...defaultProps} />);
      
      // Check for the Bookmark icon
      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument();
    });

    it('should show bookmarked icon when watched', () => {
      mockIsPostWatched.mockReturnValue(true);
      
      render(<WatchPostButton {...defaultProps} />);
      
      // Check for the BookmarkCheck icon
      expect(screen.getByTestId('bookmark-check-icon')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<WatchPostButton {...defaultProps} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Performance', () => {
    it('should prevent multiple rapid clicks', async () => {
      mockToggleWatchPost.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<WatchPostButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should only call toggle once due to loading state
      expect(mockToggleWatchPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Variants', () => {
    it('should work without text', () => {
      render(<WatchPostButton {...defaultProps} showText={false} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.queryByText('Watch')).not.toBeInTheDocument();
    });

    it('should handle missing size prop', () => {
      const { size, ...propsWithoutSize } = defaultProps;
      
      render(<WatchPostButton {...propsWithoutSize} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm'); // Default md size
    });
  });
});
