/**
 * Forum Pages Integration Tests
 * Tests the main forum pages functionality including forum listing, forum details, and post details
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForumMainPage from '@/app/forum/page';

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

// Mock child components
jest.mock('@/components/homepage/Navbar', () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Navbar</nav>;
  };
});

jest.mock('@/components/chatassistant/chatbot', () => {
  return function MockChatbot() {
    return <div data-testid="chatbot">Chatbot</div>;
  };
});

jest.mock('@/components/communityForum/UnifiedForumFeed', () => {
  return function MockUnifiedForumFeed({ className }: any) {
    return <div data-testid="unified-forum-feed" className={className}>Unified Forum Feed</div>;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock forum data
const mockForums = [
  {
    _id: 'forum-1',
    title: 'React Development',
    description: 'Discuss React development patterns, best practices, and troubleshooting.',
    image: '/forum-react.jpg',
    posts: 45,
    replies: 123,
    lastActive: '2025-01-10T10:00:00Z',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    _id: 'forum-2',
    title: 'Node.js Backend',
    description: 'Share knowledge about Node.js backend development, APIs, and server-side programming.',
    image: '/forum-nodejs.jpg',
    posts: 32,
    replies: 87,
    lastActive: '2025-01-09T15:30:00Z',
    createdAt: '2025-01-02T00:00:00Z'
  },
  {
    _id: 'forum-3',
    title: 'Database Design',
    description: 'Database architecture, optimization, and design patterns discussion.',
    image: '/forum-database.jpg',
    posts: 28,
    replies: 65,
    lastActive: '2025-01-08T12:00:00Z',
    createdAt: '2025-01-03T00:00:00Z'
  }
];

// Mock fetch responses
const createMockFetch = (forums = mockForums, shouldFail = false) => {
  return jest.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    
    if (shouldFail) {
      return Promise.reject(new Error('Network error'));
    }

    if (url.includes('/api/forums')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          forums: forums
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

describe('ForumMainPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = createMockFetch();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Page Structure', () => {
    it('should render main page elements', async () => {
      render(<ForumMainPage />);
      
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('chatbot')).toBeInTheDocument();
      expect(screen.getByText('Community Forums')).toBeInTheDocument();
    });

    it('should render page description', async () => {
      render(<ForumMainPage />);
      
      expect(screen.getByText(/Connect, share knowledge, and collaborate/)).toBeInTheDocument();
    });

    it('should render search functionality', async () => {
      render(<ForumMainPage />);
      
      expect(screen.getByPlaceholderText('Search forums...')).toBeInTheDocument();
    });

    it('should render view toggle buttons', async () => {
      render(<ForumMainPage />);
      
      expect(screen.getByText('Forums')).toBeInTheDocument();
      expect(screen.getByText('My Feed')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      render(<ForumMainPage />);
      
      expect(screen.getByText('Loading forums...')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading forums...')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });
    });
  });

  describe('Forum Display', () => {
    it('should display forums after loading', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.getByText('Node.js Backend')).toBeInTheDocument();
        expect(screen.getByText('Database Design')).toBeInTheDocument();
      });
    });

    it('should display forum descriptions', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Discuss React development patterns/)).toBeInTheDocument();
        expect(screen.getByText(/Share knowledge about Node.js backend/)).toBeInTheDocument();
      });
    });

    it('should display forum statistics', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('45 posts')).toBeInTheDocument();
        expect(screen.getByText('123 replies')).toBeInTheDocument();
        expect(screen.getByText('32 posts')).toBeInTheDocument();
        expect(screen.getByText('87 replies')).toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Jan 10, 2025/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 9, 2025/)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter forums based on search input', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.getByText('Node.js Backend')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search forums...');
      fireEvent.change(searchInput, { target: { value: 'React' } });
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.queryByText('Node.js Backend')).not.toBeInTheDocument();
      });
    });

    it('should filter by description content', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.getByText('Database Design')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search forums...');
      fireEvent.change(searchInput, { target: { value: 'optimization' } });
      
      await waitFor(() => {
        expect(screen.queryByText('React Development')).not.toBeInTheDocument();
        expect(screen.getByText('Database Design')).toBeInTheDocument();
      });
    });

    it('should show no results message when search yields no matches', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search forums...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText('No forums found')).toBeInTheDocument();
        expect(screen.getByText(/Try adjusting your search terms/)).toBeInTheDocument();
      });
    });

    it('should clear search and show all forums when input is cleared', async () => {
      render(<ForumMainPage />);
      
      const searchInput = screen.getByPlaceholderText('Search forums...');
      
      // First, search for something
      fireEvent.change(searchInput, { target: { value: 'React' } });
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.queryByText('Node.js Backend')).not.toBeInTheDocument();
      });
      
      // Then clear the search
      fireEvent.change(searchInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.getByText('Node.js Backend')).toBeInTheDocument();
        expect(screen.getByText('Database Design')).toBeInTheDocument();
      });
    });
  });

  describe('View Toggle', () => {
    it('should show forums view by default', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
      });
      
      const forumsButton = screen.getByText('Forums').closest('button');
      expect(forumsButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should switch to feed view when My Feed is clicked', async () => {
      render(<ForumMainPage />);
      
      const feedButton = screen.getByText('My Feed');
      fireEvent.click(feedButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('unified-forum-feed')).toBeInTheDocument();
      });
      
      expect(feedButton.closest('button')).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should switch back to forums view when Forums is clicked', async () => {
      render(<ForumMainPage />);
      
      // Switch to feed view first
      const feedButton = screen.getByText('My Feed');
      fireEvent.click(feedButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('unified-forum-feed')).toBeInTheDocument();
      });
      
      // Switch back to forums view
      const forumsButton = screen.getByText('Forums');
      fireEvent.click(forumsButton);
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.queryByTestId('unified-forum-feed')).not.toBeInTheDocument();
      });
    });

    it('should show correct button text for authenticated user', async () => {
      render(<ForumMainPage />);
      
      expect(screen.getByText('My Feed')).toBeInTheDocument();
    });

    it('should show "Recent Posts" for unauthenticated user', async () => {
      // Mock unauthenticated user
      jest.mocked(require('@/lib/context/AuthContext').useAuth).mockReturnValue({
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false
      });
      
      render(<ForumMainPage />);
      
      expect(screen.getByText('Recent Posts')).toBeInTheDocument();
    });
  });

  describe('Forum Navigation', () => {
    it('should navigate to forum detail when forum is clicked', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('React Development'));
      });
      
      expect(mockPush).toHaveBeenCalledWith('/forum/forum-1');
    });

    it('should handle forum click with hover effects', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        const forumCard = screen.getByText('React Development').closest('div');
        expect(forumCard).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no forums exist', async () => {
      global.fetch = createMockFetch([]);
      
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No forums available')).toBeInTheDocument();
        expect(screen.getByText(/Check back later for new forum discussions/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error state when API fails', async () => {
      global.fetch = createMockFetch([], true);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Unable to load forums. Please try again later.')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });

    it('should handle API error responses', async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          json: () => Promise.resolve({ success: false, message: 'Server error' }),
          ok: false,
          status: 500
        } as Response)
      ) as jest.MockedFunction<typeof fetch>;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive grid classes', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        const gridContainer = screen.getByText('React Development').closest('.grid');
        expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
      });
    });

    it('should handle mobile layout', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        const searchContainer = screen.getByPlaceholderText('Search forums...').closest('.flex');
        expect(searchContainer).toHaveClass('flex-col', 'sm:flex-row');
      });
    });
  });

  describe('Performance', () => {
    it('should not fetch forums multiple times on re-render', async () => {
      const { rerender } = render(<ForumMainPage />);
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
      });
      
      rerender(<ForumMainPage />);
      
      // Should only call fetch once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid search input changes', async () => {
      render(<ForumMainPage />);
      
      const searchInput = screen.getByPlaceholderText('Search forums...');
      
      // Rapid typing
      fireEvent.change(searchInput, { target: { value: 'R' } });
      fireEvent.change(searchInput, { target: { value: 'Re' } });
      fireEvent.change(searchInput, { target: { value: 'Rea' } });
      fireEvent.change(searchInput, { target: { value: 'React' } });
      
      await waitFor(() => {
        expect(screen.getByText('React Development')).toBeInTheDocument();
        expect(screen.queryByText('Node.js Backend')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<ForumMainPage />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Community Forums');
    });

    it('should have proper search input accessibility', () => {
      render(<ForumMainPage />);
      
      const searchInput = screen.getByPlaceholderText('Search forums...');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('aria-label');
    });

    it('should have accessible navigation buttons', () => {
      render(<ForumMainPage />);
      
      const forumsButton = screen.getByText('Forums').closest('button');
      const feedButton = screen.getByText('My Feed').closest('button');
      
      expect(forumsButton).toHaveAttribute('type', 'button');
      expect(feedButton).toHaveAttribute('type', 'button');
    });

    it('should provide meaningful alt text for forum images', async () => {
      render(<ForumMainPage />);
      
      await waitFor(() => {
        const forumImages = screen.getAllByRole('img');
        forumImages.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });
      });
    });
  });
});
