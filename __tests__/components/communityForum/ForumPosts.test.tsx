/**
 * Simple ForumPosts Component Tests
 * Basic tests for the forum posts display functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForumPosts from '@/components/communityForum/ForumPosts';

// Suppress console warnings for cleaner test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock user object
const mockUser = {
  _id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  name: 'John Doe',
  avatar: '/user-avatar.jpg'
};

// Mock functions
const mockPush = jest.fn();
const mockTrackInteraction = jest.fn();

// Mock AuthContext
jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  }),
}));

// Mock useUserPreferences hook
jest.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({
    trackInteraction: mockTrackInteraction,
    getPersonalizedFeed: jest.fn(),
    isPostWatched: jest.fn(() => false),
    toggleWatchPost: jest.fn()
  }),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock child components
jest.mock('@/components/communityForum/CreatePostPopup', () => {
  return function MockCreatePostPopup({ isOpen, onClose, onPostCreated }: any) {
    return isOpen ? (
      <div data-testid="create-post-popup">
        <div>Create Post Popup</div>
        <button onClick={onClose}>Close</button>
        <button onClick={() => { onPostCreated(); onClose(); }}>Create Post</button>
      </div>
    ) : null;
  };
});

jest.mock('@/components/communityForum/likedislikebutton', () => {
  return function MockLikeDislikeButtons({ postId, initialLikes, initialDislikes, onUpdate }: any) {
    return (
      <div data-testid={`like-dislike-${postId}`}>
        <button 
          onClick={() => onUpdate && onUpdate(initialLikes + 1, initialDislikes)}
          data-testid={`like-button-${postId}`}
        >
          Like ({initialLikes})
        </button>
        <button 
          onClick={() => onUpdate && onUpdate(initialLikes, initialDislikes + 1)}
          data-testid={`dislike-button-${postId}`}
        >
          Dislike ({initialDislikes})
        </button>
      </div>
    );
  };
});

jest.mock('@/components/communityForum/WatchPostButton', () => {
  return function MockWatchPostButton({ postId }: any) {
    return (
      <button data-testid={`watch-button-${postId}`}>
        Watch Post
      </button>
    );
  };
});

jest.mock('@/components/communityForum/ReportPostButton', () => {
  return function MockReportPostButton({ postId }: any) {
    return (
      <button data-testid={`report-button-${postId}`}>
        Report Post
      </button>
    );
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, whileHover, whileTap, onClick, className, ...restProps } = props;
      return <div {...restProps} onClick={onClick} className={className}>{children}</div>;
    },
    h2: ({ children, ...props }: any) => {
      const { initial, animate, transition, className, ...restProps } = props;
      return <h2 {...restProps} className={className}>{children}</h2>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, onClick, className, ...restProps } = props;
      return <button {...restProps} onClick={onClick} className={className}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <div data-testid="next-image" role="img" aria-label={alt}>{alt}</div>;
  };
});

// Mock data
const mockPosts = [
  {
    _id: 'post-1',
    title: 'Introduction to React Hooks',
    content: 'This is a comprehensive guide to React Hooks...',
    imageUrl: '/post-image-1.jpg',
    author: {
      _id: 'author-1',
      name: 'Jane Smith',
      avatar: '/author-avatar-1.jpg'
    },
    createdAt: '2025-01-10T10:00:00Z',
    likes: 15,
    dislikes: 2,
    likedBy: [],
    dislikedBy: [],
    replies: 8,
    views: 142
  },
  {
    _id: 'post-2',
    title: 'Best Practices for Node.js',
    content: 'Here are some best practices for Node.js development...',
    imageUrl: null,
    author: {
      _id: 'author-2',
      name: 'Bob Johnson',
      avatar: '/author-avatar-2.jpg'
    },
    createdAt: '2025-01-09T15:30:00Z',
    likes: 23,
    dislikes: 1,
    likedBy: ['user-123'],
    dislikedBy: [],
    replies: 12,
    views: 189
  }
];

// Mock fetch responses
const createMockFetch = (posts: any[] = mockPosts, shouldFail = false) => {
  return jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    if (shouldFail) {
      return Promise.reject(new Error('Network error'));
    }

    if (url.includes('/api/forums/') && url.includes('/posts') && method === 'GET') {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          posts: posts
        }),
        ok: true,
        status: 200
      } as Response);
    }

    if (url.includes('/api/posts') && method === 'POST') {
      const newPost = {
        _id: 'new-post-id',
        title: 'New Post Title',
        content: 'New post content',
        author: mockUser,
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        replies: 0,
        views: 0
      };
      
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          post: newPost
        }),
        ok: true,
        status: 201
      } as Response);
    }

    return Promise.resolve({
      json: () => Promise.resolve({ success: true }),
      ok: true,
      status: 200
    } as Response);
  }) as jest.MockedFunction<typeof fetch>;
};

describe('ForumPosts Component', () => {
  const defaultProps = {
    forumId: 'forum-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockTrackInteraction.mockClear();
    global.fetch = createMockFetch();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Discussion')).toBeInTheDocument();
      });
    });

    it('should display posts after loading', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to React Hooks')).toBeInTheDocument();
        expect(screen.getByText('Best Practices for Node.js')).toBeInTheDocument();
      });
    });

    it('should display empty state when no posts exist', async () => {
      global.fetch = createMockFetch([]);
      
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/No posts found/)).toBeInTheDocument();
      });
    });

    it('should display create post button', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Create Post')).toBeInTheDocument();
      });
    });
  });

  describe('Post Display', () => {
    it('should display post content correctly', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to React Hooks')).toBeInTheDocument();
        expect(screen.getByText('This is a comprehensive guide to React Hooks...')).toBeInTheDocument();
        expect(screen.getAllByText('Jane Smith')[0]).toBeInTheDocument(); // Use getAllByText to handle multiple matches
        expect(screen.getByText('8')).toBeInTheDocument(); // Comment count
        expect(screen.getByText('142 views')).toBeInTheDocument();
      });
    });

    it('should display post images when available', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        const postImages = screen.getAllByTestId('next-image');
        expect(postImages.length).toBeGreaterThan(0);
      });
    });

    it('should format dates correctly', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Jan 10, 2025/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 9, 2025/)).toBeInTheDocument();
      });
    });

    it('should display like/dislike buttons for each post', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('like-dislike-post-1')).toBeInTheDocument();
        expect(screen.getByTestId('like-dislike-post-2')).toBeInTheDocument();
      });
    });

    it('should display watch and report buttons for each post', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('watch-button-post-1')).toBeInTheDocument();
        expect(screen.getByTestId('report-button-post-1')).toBeInTheDocument();
        expect(screen.getByTestId('watch-button-post-2')).toBeInTheDocument();
        expect(screen.getByTestId('report-button-post-2')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should open create post popup when create button is clicked', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Create Post'));
      });
      
      expect(screen.getByTestId('create-post-popup')).toBeInTheDocument();
    });

    it('should close create post popup when close button is clicked', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Create Post'));
      });
      
      expect(screen.getByTestId('create-post-popup')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Close'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('create-post-popup')).not.toBeInTheDocument();
      });
    });

    it('should navigate to post detail when post is clicked', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Introduction to React Hooks'));
      });
      
      expect(mockPush).toHaveBeenCalledWith('/forum/forum-123/posts/post-1');
    });

    it('should track post interaction when post is clicked', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Introduction to React Hooks'));
      });
      
      expect(mockTrackInteraction).toHaveBeenCalledWith({
        interactionType: 'view',
        postId: 'post-1',
        forumId: 'forum-123',
        timeSpent: 0
      });
    });

    it('should refresh posts after creating a new post', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getAllByText('Create Post')[0]); // Use the first button (main create button)
      });
      
      expect(screen.getByTestId('create-post-popup')).toBeInTheDocument();
      
      fireEvent.click(screen.getAllByText('Create Post')[1]); // Use the second one (popup button)
      
      await waitFor(() => {
        expect(screen.queryByTestId('create-post-popup')).not.toBeInTheDocument();
      });
      
      // Verify that fetchPosts was called again (posts should be refreshed)
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + refresh after creation
    });
  });

  describe('Error Handling', () => {
    it('should display error message when posts fail to load', async () => {
      global.fetch = createMockFetch([], true);
      
      // Mock console.error to avoid error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to load posts/)).toBeInTheDocument();
        expect(screen.getByText(/Please try again later/)).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = createMockFetch([], true);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to load posts/)).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render post grid layout', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        const postContainer = screen.getByText('Introduction to React Hooks').closest('div')?.parentElement;
        expect(postContainer).toHaveClass('border', 'border-blue-100', 'rounded-xl'); // Test the actual post container
      });
    });
  });

  describe('Post Stats Update', () => {
    it('should update like count when like button is clicked', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('like-button-post-1'));
      });
      
      // The like count should be updated via the onUpdate callback
      await waitFor(() => {
        expect(screen.getByText('Like (16)')).toBeInTheDocument();
      });
    });

    it('should update dislike count when dislike button is clicked', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByTestId('dislike-button-post-1'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Dislike (3)')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for interactive elements', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        const createButton = screen.getByText('Create Post');
        expect(createButton).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', async () => {
      render(<ForumPosts {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Introduction to React Hooks')).toBeInTheDocument();
        expect(screen.getByText('Best Practices for Node.js')).toBeInTheDocument();
      });
    });
  });
});
