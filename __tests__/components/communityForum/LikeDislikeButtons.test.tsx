/**
 * LikeDislikeButtons Component Tests
 * Tests the like/dislike functionality for forum posts
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LikeDislikeButtons from '@/components/communityForum/likedislikebutton';

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

// Mock fetch responses
const createMockFetch = (
  shouldSucceed = true, 
  operation = 'like',
  updatedLikes = 1,
  updatedDislikes = 0
) => {
  return jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    if (url.includes('/api/posts/') && method === 'PATCH') {
      if (!shouldSucceed) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: false, message: 'Server error' }),
          ok: false,
          status: 500
        } as Response);
      }
      
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          post: {
            _id: 'post-123',
            likes: updatedLikes,
            dislikes: updatedDislikes,
            likedBy: operation === 'like' ? ['user-123'] : [],
            dislikedBy: operation === 'dislike' ? ['user-123'] : []
          }
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

describe('LikeDislikeButtons Component', () => {
  const defaultProps = {
    postId: 'post-123',
    initialLikes: 5,
    initialDislikes: 2,
    initialLikeStatus: null as 'liked' | 'disliked' | null,
    onUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = createMockFetch();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render like and dislike buttons with initial counts', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dislike/i })).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Like count
      expect(screen.getByText('2')).toBeInTheDocument(); // Dislike count
    });

    it('should show active state when post is liked', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="liked" 
        />
      );
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      expect(likeButton).toHaveClass('text-blue-600');
    });

    it('should show active state when post is disliked', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="disliked" 
        />
      );
      
      const dislikeButton = screen.getByRole('button', { name: /dislike/i });
      expect(dislikeButton).toHaveClass('text-red-600');
    });

    it('should show inactive state when post is not liked or disliked', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      const dislikeButton = screen.getByRole('button', { name: /dislike/i });
      
      expect(likeButton).toHaveClass('text-gray-500');
      expect(dislikeButton).toHaveClass('text-gray-500');
    });
  });

  describe('Like Functionality', () => {
    it('should handle like action correctly', async () => {
      global.fetch = createMockFetch(true, 'like', 6, 2);
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/posts/post-123',
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              operation: 'like',
              userId: 'current-user-id'
            })
          })
        );
      });
    });

    it('should update like count after successful like', async () => {
      global.fetch = createMockFetch(true, 'like', 6, 2);
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(screen.getByText('6')).toBeInTheDocument(); // Updated like count
        expect(defaultProps.onUpdate).toHaveBeenCalledWith(6, 2);
      });
    });

    it('should handle unlike action when already liked', async () => {
      global.fetch = createMockFetch(true, 'unlike', 4, 2);
      
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="liked" 
        />
      );
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/posts/post-123',
          expect.objectContaining({
            body: JSON.stringify({
              operation: 'unlike',
              userId: 'current-user-id'
            })
          })
        );
      });
    });

    it('should show animation when like button is clicked', async () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      // Check for animation class (this would depend on the actual implementation)
      expect(likeButton.closest('div')).toHaveClass('transform');
    });

    it('should prevent multiple clicks during API call', async () => {
      // Create a slow-responding fetch mock
      global.fetch = jest.fn(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            json: () => Promise.resolve({ 
              success: true, 
              post: { likes: 6, dislikes: 2 } 
            }),
            ok: true,
            status: 200
          } as Response), 100)
        )
      ) as jest.MockedFunction<typeof fetch>;
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      
      // Click multiple times quickly
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);
      
      // Should only make one API call
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dislike Functionality', () => {
    it('should handle dislike action correctly', async () => {
      global.fetch = createMockFetch(true, 'dislike', 5, 3);
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const dislikeButton = screen.getByRole('button', { name: /dislike/i });
      fireEvent.click(dislikeButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/posts/post-123',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({
              operation: 'dislike',
              userId: 'current-user-id'
            })
          })
        );
      });
    });

    it('should update dislike count after successful dislike', async () => {
      global.fetch = createMockFetch(true, 'dislike', 5, 3);
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const dislikeButton = screen.getByRole('button', { name: /dislike/i });
      fireEvent.click(dislikeButton);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Updated dislike count
        expect(defaultProps.onUpdate).toHaveBeenCalledWith(5, 3);
      });
    });

    it('should handle undislike action when already disliked', async () => {
      global.fetch = createMockFetch(true, 'undislike', 5, 1);
      
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="disliked" 
        />
      );
      
      const dislikeButton = screen.getByRole('button', { name: /dislike/i });
      fireEvent.click(dislikeButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/posts/post-123',
          expect.objectContaining({
            body: JSON.stringify({
              operation: 'undislike',
              userId: 'current-user-id'
            })
          })
        );
      });
    });
  });

  describe('State Transitions', () => {
    it('should switch from like to dislike correctly', async () => {
      // First, set up a liked state
      global.fetch = createMockFetch(true, 'dislike', 4, 3);
      
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="liked" 
        />
      );
      
      const dislikeButton = screen.getByRole('button', { name: /dislike/i });
      fireEvent.click(dislikeButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/posts/post-123',
          expect.objectContaining({
            body: JSON.stringify({
              operation: 'dislike',
              userId: 'current-user-id'
            })
          })
        );
      });
    });

    it('should switch from dislike to like correctly', async () => {
      global.fetch = createMockFetch(true, 'like', 6, 1);
      
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="disliked" 
        />
      );
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/posts/post-123',
          expect.objectContaining({
            body: JSON.stringify({
              operation: 'like',
              userId: 'current-user-id'
            })
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch = createMockFetch(false);
      
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to update like status:',
          expect.any(Error)
        );
      });
      
      // Counts should remain unchanged
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.MockedFunction<typeof fetch>;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to update like status:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });

    it('should revert optimistic updates on error', async () => {
      global.fetch = createMockFetch(false);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      await waitFor(() => {
        // Should revert to original counts
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      const dislikeButton = screen.getByRole('button', { name: /dislike/i });
      
      expect(likeButton).toHaveAttribute('aria-label');
      expect(dislikeButton).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      const dislikeButton = screen.getByRole('button', { name: /dislike/i });
      
      expect(likeButton).toHaveAttribute('tabIndex', '0');
      expect(dislikeButton).toHaveAttribute('tabIndex', '0');
    });

    it('should show visual feedback for active states', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="liked" 
        />
      );
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      expect(likeButton).toHaveClass('text-blue-600');
    });
  });

  describe('Performance', () => {
    it('should debounce rapid clicks', async () => {
      jest.useFakeTimers();
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      
      // Click rapidly
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);
      fireEvent.click(likeButton);
      
      // Fast-forward time
      jest.advanceTimersByTime(100);
      
      await waitFor(() => {
        // Should only make one API call due to loading state prevention
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      jest.useRealTimers();
    });
  });

  describe('Visual States', () => {
    it('should show loading state during API call', async () => {
      // Create a delayed fetch mock
      global.fetch = jest.fn(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            json: () => Promise.resolve({ 
              success: true, 
              post: { likes: 6, dislikes: 2 } 
            }),
            ok: true,
            status: 200
          } as Response), 100)
        )
      ) as jest.MockedFunction<typeof fetch>;
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      fireEvent.click(likeButton);
      
      // Button should be disabled during loading
      expect(likeButton).toBeDisabled();
    });

    it('should show correct tooltip text', async () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeButton = screen.getByRole('button', { name: /like/i });
      
      // Hover to show tooltip
      fireEvent.mouseEnter(likeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/like this post/i)).toBeInTheDocument();
      });
    });
  });
});
