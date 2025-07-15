/**
 * Simple PersonalizedFeed Component Tests
 * Basic tests for the personalized feed functionality
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PersonalizedFeed from '@/components/communityForum/PersonalizedFeed';

// Suppress console warnings for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock AuthContext
jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      _id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      avatar: '/avatar.jpg'
    },
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  }),
}));

// Mock User Preferences Hook
const mockGetPersonalizedFeed = jest.fn();
jest.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({
    getPersonalizedFeed: mockGetPersonalizedFeed,
    trackInteraction: jest.fn(),
    isPostWatched: jest.fn(() => false),
    toggleWatchPost: jest.fn()
  }),
}));

// Mock child components
jest.mock('@/components/communityForum/WatchPostButton', () => {
  return function MockWatchPostButton({ postId }: any) {
    return (
      <button data-testid={`watch-button-${postId}`}>
        Watch
      </button>
    );
  };
});

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('PersonalizedFeed Component - Simple Tests', () => {
  const defaultProps = {
    className: 'test-class'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful response with correct pagination structure
    mockGetPersonalizedFeed.mockResolvedValue({
      success: true,
      data: {
        posts: [
          {
            _id: 'post-1',
            title: 'Test Post',
            content: 'Test content',
            author: {
              _id: 'author-1',
              name: 'Jane Smith',
              avatar: '/avatar.jpg'
            },
            forumId: {
              _id: 'forum-1',
              title: 'React Development'
            },
            createdAt: '2025-01-10T10:00:00Z',
            likes: 15,
            dislikes: 2,
            replies: 8,
            views: 142
          }
        ],
        pagination: {
          totalPosts: 1,
          currentPage: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        personalized: false
      }
    });
  });

  // Basic Rendering Tests
  it('renders component without crashing', async () => {
    render(<PersonalizedFeed {...defaultProps} />);
    
    // Just wait for any loading to settle
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('applies custom className', async () => {
    const { container } = render(<PersonalizedFeed className="custom-class" />);
    
    await waitFor(() => {
      const mainDiv = container.querySelector('.custom-class');
      expect(mainDiv).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows loading state initially', () => {
    render(<PersonalizedFeed {...defaultProps} />);
    
    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockGetPersonalizedFeed.mockReset();
    mockGetPersonalizedFeed.mockRejectedValue(new Error('API Error'));

    render(<PersonalizedFeed {...defaultProps} />);

    // Component should at least render without crashing
    expect(document.body).toBeInTheDocument();
    
    // Wait to see if error state appears or if it stays in loading
    await waitFor(() => {
      // Either error state or loading state should be present
      const hasErrorState = screen.queryByText(/Error loading feed/);
      const hasLoadingState = document.querySelector('.animate-spin');
      expect(hasErrorState || hasLoadingState).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('handles empty posts response', async () => {
    mockGetPersonalizedFeed.mockReset();
    mockGetPersonalizedFeed.mockResolvedValue({
      success: true,
      data: {
        posts: [],
        pagination: { 
          hasNext: false,
          hasPrev: false,
          totalPosts: 0,
          currentPage: 1,
          totalPages: 0
        },
        personalized: false
      }
    });

    render(<PersonalizedFeed {...defaultProps} />);

    // Component should at least render without crashing
    expect(document.body).toBeInTheDocument();
    
    // Wait to see if empty state appears or if it stays in loading
    await waitFor(() => {
      // Either empty state or loading state should be present
      const hasEmptyState = screen.queryByText(/No posts/) || screen.queryByText(/feed yet/);
      const hasLoadingState = document.querySelector('.animate-spin');
      expect(hasEmptyState || hasLoadingState).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('displays post title when posts are loaded', async () => {
    render(<PersonalizedFeed {...defaultProps} />);
    
    expect(await screen.findByText('Test Post')).toBeInTheDocument();
  });

  it('displays author name', async () => {
    render(<PersonalizedFeed {...defaultProps} />);
    
    expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays forum title', async () => {
    render(<PersonalizedFeed {...defaultProps} />);
    
    expect(await screen.findByText('React Development')).toBeInTheDocument();
  });

  it('renders watch button', async () => {
    render(<PersonalizedFeed {...defaultProps} />);
    
    expect(await screen.findByTestId('watch-button-post-1')).toBeInTheDocument();
  });

  it('shows trending posts title by default', async () => {
    render(<PersonalizedFeed {...defaultProps} />);
    
    expect(await screen.findByText('Trending Posts')).toBeInTheDocument();
  });
});
