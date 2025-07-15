/**
 * PersonalizedFeed Component Tests
 * Tests the personalized content feed functionality for community forums
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonalizedFeed from '@/components/communityForum/PersonalizedFeed';

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
const mockGetPersonalizedFeed = jest.fn();
const mockTrackInteraction = jest.fn();

jest.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({
    getPersonalizedFeed: mockGetPersonalizedFeed,
    trackInteraction: mockTrackInteraction,
    isPostWatched: jest.fn(() => false),
    toggleWatchPost: jest.fn()
  }),
}));

// Mock child components
jest.mock('@/components/communityForum/WatchPostButton', () => {
  return function MockWatchPostButton({ postId, size }: any) {
    return (
      <button data-testid={`watch-button-${postId}`} className={`size-${size}`}>
        Watch
      </button>
    );
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock data
const mockPosts = [
  {
    _id: 'post-1',
    title: 'Getting Started with React Hooks',
    content: 'This is a comprehensive guide to using React Hooks effectively...',
    author: {
      _id: 'author-1',
      name: 'Jane Smith',
      avatar: '/author-1.jpg'
    },
    forumId: {
      _id: 'forum-1',
      title: 'React Development',
      description: 'React discussion forum'
    },
    createdAt: '2025-01-10T10:00:00Z',
    likes: 15,
    dislikes: 2,
    replies: 8,
    views: 142,
    score: 0.85
  },
  {
    _id: 'post-2',
    title: 'Advanced Node.js Patterns',
    content: 'Learn advanced patterns for Node.js development...',
    author: {
      _id: 'author-2',
      name: 'Bob Johnson',
      avatar: '/author-2.jpg'
    },
    forumId: {
      _id: 'forum-2',
      title: 'Backend Development',
      description: 'Backend discussion forum'
    },
    createdAt: '2025-01-09T15:30:00Z',
    likes: 23,
    dislikes: 1,
    replies: 12,
    views: 189,
    score: 0.92
  }
];

const mockPersonalizedFeedResponse = {
  success: true,
  data: {
    posts: mockPosts,
    totalPosts: 2,
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  }
};

describe('PersonalizedFeed Component', () => {
  const defaultProps = {
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPersonalizedFeed.mockResolvedValue(mockPersonalizedFeedResponse);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      expect(screen.getByText('Loading your personalized feed...')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should render posts after loading', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started with React Hooks')).toBeInTheDocument();
        expect(screen.getByText('Advanced Node.js Patterns')).toBeInTheDocument();
      });
    });

    it('should render empty state when no posts are available', async () => {
      mockGetPersonalizedFeed.mockResolvedValue({
        success: true,
        data: {
          posts: [],
          totalPosts: 0,
          currentPage: 1,
          totalPages: 0,
          hasMore: false
        }
      });
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No personalized content yet')).toBeInTheDocument();
        expect(screen.getByText('Explore Forums')).toBeInTheDocument();
      });
    });

    it('should apply custom className', async () => {
      const { container } = render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(container.firstChild).toHaveClass('test-class');
      });
    });
  });

  describe('Post Display', () => {
    it('should display post content correctly', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started with React Hooks')).toBeInTheDocument();
        expect(screen.getByText('This is a comprehensive guide to using React Hooks effectively...')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('React Development')).toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Jan 10, 2025/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 9, 2025/)).toBeInTheDocument();
      });
    });

    it('should display post stats correctly', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument(); // Likes
        expect(screen.getByText('8')).toBeInTheDocument(); // Replies
        expect(screen.getByText('142')).toBeInTheDocument(); // Views
      });
    });

    it('should show forum badges for each post', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.getByText('Backend Development')).toBeInTheDocument();
      });
    });

    it('should render watch buttons for each post', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('watch-button-post-1')).toBeInTheDocument();
        expect(screen.getByTestId('watch-button-post-2')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to post detail when post is clicked', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Getting Started with React Hooks'));
      });
      
      expect(mockPush).toHaveBeenCalledWith('/forum/forum-1/posts/post-1');
    });

    it('should track post interaction when post is clicked', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Getting Started with React Hooks'));
      });
      
      expect(mockTrackInteraction).toHaveBeenCalledWith('post_view', 'post-1');
    });

    it('should navigate to forums page when Explore Forums is clicked', async () => {
      mockGetPersonalizedFeed.mockResolvedValue({
        success: true,
        data: {
          posts: [],
          totalPosts: 0,
          currentPage: 1,
          totalPages: 0,
          hasMore: false
        }
      });
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Explore Forums'));
      });
      
      expect(mockPush).toHaveBeenCalledWith('/forum');
    });

    it('should load more posts when Load More button is clicked', async () => {
      mockGetPersonalizedFeed
        .mockResolvedValueOnce({
          success: true,
          data: {
            posts: [mockPosts[0]],
            totalPosts: 2,
            currentPage: 1,
            totalPages: 2,
            hasMore: true
          }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            posts: [mockPosts[1]],
            totalPosts: 2,
            currentPage: 2,
            totalPages: 2,
            hasMore: false
          }
        });
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started with React Hooks')).toBeInTheDocument();
        expect(screen.getByText('Load More Posts')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Load More Posts'));
      
      await waitFor(() => {
        expect(screen.getByText('Advanced Node.js Patterns')).toBeInTheDocument();
        expect(screen.queryByText('Load More Posts')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator for initial load', () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('Loading your personalized feed...')).toBeInTheDocument();
    });

    it('should show loading state for load more action', async () => {
      mockGetPersonalizedFeed
        .mockResolvedValueOnce({
          success: true,
          data: {
            posts: [mockPosts[0]],
            totalPosts: 2,
            currentPage: 1,
            totalPages: 2,
            hasMore: true
          }
        })
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              success: true,
              data: {
                posts: [mockPosts[1]],
                totalPosts: 2,
                currentPage: 2,
                totalPages: 2,
                hasMore: false
              }
            }), 100)
          )
        );
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Load More Posts'));
      
      expect(screen.getByText('Loading more...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when feed fails to load', async () => {
      mockGetPersonalizedFeed.mockRejectedValue(new Error('Network error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load your personalized feed')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      mockGetPersonalizedFeed.mockResolvedValue({
        success: false,
        message: 'Server error'
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load your personalized feed')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('should retry loading when Try Again is clicked', async () => {
      mockGetPersonalizedFeed
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockPersonalizedFeedResponse);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Try Again'));
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started with React Hooks')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle load more errors gracefully', async () => {
      mockGetPersonalizedFeed
        .mockResolvedValueOnce({
          success: true,
          data: {
            posts: [mockPosts[0]],
            totalPosts: 2,
            currentPage: 1,
            totalPages: 2,
            hasMore: true
          }
        })
        .mockRejectedValueOnce(new Error('Load more failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Load More Posts'));
      
      await waitFor(() => {
        expect(screen.getByText('Load More Posts')).toBeInTheDocument(); // Button should reappear
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not reload posts unnecessarily', async () => {
      const { rerender } = render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started with React Hooks')).toBeInTheDocument();
      });
      
      // Re-render with same props
      rerender(<PersonalizedFeed {...defaultProps} />);
      
      // Should not call API again
      expect(mockGetPersonalizedFeed).toHaveBeenCalledTimes(1);
    });

    it('should implement proper pagination', async () => {
      const firstPageResponse = {
        success: true,
        data: {
          posts: [mockPosts[0]],
          totalPosts: 2,
          currentPage: 1,
          totalPages: 2,
          hasMore: true
        }
      };
      
      mockGetPersonalizedFeed.mockResolvedValue(firstPageResponse);
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockGetPersonalizedFeed).toHaveBeenCalledWith(1, 10);
      });
    });
  });

  describe('Content Filtering', () => {
    it('should display recommendation tip for new users', async () => {
      mockGetPersonalizedFeed.mockResolvedValue({
        success: true,
        data: {
          posts: [mockPosts[0]],
          totalPosts: 1,
          currentPage: 1,
          totalPages: 1,
          hasMore: false
        }
      });
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Interact with posts you like/)).toBeInTheDocument();
        expect(screen.getByText(/Like, comment, and watch posts/)).toBeInTheDocument();
      });
    });

    it('should handle posts with missing data gracefully', async () => {
      const postsWithMissingData = [
        {
          _id: 'post-1',
          title: 'Test Post',
          content: 'Test content',
          author: {
            _id: 'author-1',
            name: null, // Missing name
            avatar: null // Missing avatar
          },
          forumId: {
            _id: 'forum-1',
            title: 'Test Forum',
            description: 'Test forum'
          },
          createdAt: '2025-01-10T10:00:00Z',
          likes: 0,
          dislikes: 0,
          replies: 0,
          views: 0
        }
      ];
      
      mockGetPersonalizedFeed.mockResolvedValue({
        success: true,
        data: {
          posts: postsWithMissingData,
          totalPosts: 1,
          currentPage: 1,
          totalPages: 1,
          hasMore: false
        }
      });
      
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Post')).toBeInTheDocument();
        expect(screen.getByText('Anonymous')).toBeInTheDocument(); // Fallback for missing name
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Getting Started with React Hooks')).toBeInTheDocument();
      });
      
      const postTitles = screen.getAllByRole('heading');
      expect(postTitles.length).toBeGreaterThan(0);
    });

    it('should have proper link accessibility', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        const postLinks = screen.getAllByRole('link');
        postLinks.forEach(link => {
          expect(link).toHaveAttribute('href');
        });
      });
    });

    it('should provide meaningful alt text for images', async () => {
      render(<PersonalizedFeed {...defaultProps} />);
      
      await waitFor(() => {
        const avatarImages = screen.getAllByRole('img');
        avatarImages.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });
      });
    });
  });
});
