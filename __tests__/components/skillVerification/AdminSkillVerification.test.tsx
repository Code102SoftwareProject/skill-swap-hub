/**
 * Admin Skill Verification Tests
 * Comprehensive test suite for skill verification management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import VerificationRequests from '@/components/Admin/skillverifications';

// Mock data
const mockRequests = [
  {
    id: 'req-1',
    userId: 'user-123',
    skillId: 'skill-1',
    skillName: 'React Development',
    status: 'pending',
    documents: ['doc1.pdf', 'cert.pdf'],
    description: '3 years of React experience',
    createdAt: '2025-01-15T10:00:00Z',
    user: {
      _id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      avatar: 'avatar1.jpg'
    }
  },
  {
    id: 'req-2',
    userId: 'user-456',
    skillId: 'skill-2',
    skillName: 'Node.js',
    status: 'approved',
    documents: ['node-cert.pdf'],
    description: 'Node.js certification',
    createdAt: '2025-01-10T09:00:00Z',
    user: {
      _id: 'user-456',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com'
    }
  }
];

// Mock fetch
beforeEach(() => {
  global.fetch = jest.fn().mockImplementation((url: string | URL | Request, options?: RequestInit) => {
    const method = options?.method || 'GET';
    const urlString = url.toString();

    // Get all requests
    if (urlString === '/api/admin/skill-verification-requests' && method === 'GET') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockRequests })
      } as unknown as Response);
    }

    // Get user profile
    if (urlString.startsWith('/api/users/profile') && method === 'GET') {
      const userId = urlString.includes('user-123') ? 'user-123' : 'user-456';
      const user = mockRequests.find(r => r.userId === userId)?.user;
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, user })
      } as unknown as Response);
    }

    // Update request status
    if (urlString.includes('/api/admin/skill-verification-requests/') && method === 'PATCH') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          message: 'Status updated' 
        })
      } as unknown as Response);
    }

    // Get document
    if (urlString === '/api/documents/access' && method === 'POST') {
      return Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test']))
      } as unknown as Response);
    }

    return Promise.reject(new Error(`Unhandled request: ${urlString}`));
  });

  // Mock document URL creation
  global.URL.createObjectURL = jest.fn(() => 'mock-url');
  global.URL.revokeObjectURL = jest.fn();
  
  // Mock window.open
  window.open = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('VerificationRequests Component', () => {
  test('renders loading state initially', () => {
    render(<VerificationRequests />);
    // Check for the refresh button with "Refreshing..." text
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    // Check for the loading spinner
    const loadingSpinner = document.querySelector('.border-4.border-indigo-500.border-t-transparent.rounded-full.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  test('displays requests after loading', async () => {
    render(<VerificationRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('React Development')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByText('2 requests found')).toBeInTheDocument();
    });
  });

  test('shows search and filter controls', async () => {
    render(<VerificationRequests />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name, email, skill...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pending' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approved' })).toBeInTheDocument();
    });
  });

  test('filters requests by status', async () => {
    const user = userEvent.setup();
    render(<VerificationRequests />);
    
    await waitFor(() => screen.getByText('React Development'));
    
    await user.click(screen.getByRole('button', { name: 'Pending' }));
    
    await waitFor(() => {
      expect(screen.getByText('React Development')).toBeInTheDocument();
      expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
      expect(screen.getByText('1 request found')).toBeInTheDocument();
    });
  });

  test('searches requests by skill name', async () => {
    const user = userEvent.setup();
    render(<VerificationRequests />);
    
    await waitFor(() => screen.getByText('React Development'));
    
    await user.type(screen.getByPlaceholderText('Search by name, email, skill...'), 'React');
    
    await waitFor(() => {
      expect(screen.getByText('React Development')).toBeInTheDocument();
      expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
    });
  });

  test('displays request details when clicked', async () => {
    const user = userEvent.setup();
    render(<VerificationRequests />);
    
    await waitFor(() => screen.getByText('React Development'));
    
    const requestCard = screen.getByText('React Development').closest('div')!;
    await user.click(requestCard);
    
    await waitFor(() => {
      expect(screen.getByText('Verification Request Details')).toBeInTheDocument();
      
      // Find the heading element with John Doe text
      const headingElement = screen.getAllByText('John Doe').find(
        element => element.tagName.toLowerCase() === 'h3'
      );
      expect(headingElement).toBeInTheDocument();
      
      expect(screen.getByText('3 years of React experience')).toBeInTheDocument();
    });
  });

  test('approves a request successfully', async () => {
    const user = userEvent.setup();
    render(<VerificationRequests />);
    
    await waitFor(() => screen.getByText('React Development'));
    
    const requestCard = screen.getByText('React Development').closest('div')!;
    await user.click(requestCard);
    
    await waitFor(() => screen.getByRole('button', { name: 'Approve' }));
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/skill-verification-requests/req-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            status: 'approved',
            skillId: 'skill-1'
          })
        })
      );
      expect(screen.getByText('Skill verification request has been approved successfully')).toBeInTheDocument();
    });
  });

  test('rejects a request with feedback', async () => {
    const user = userEvent.setup();
    render(<VerificationRequests />);
    
    await waitFor(() => screen.getByText('React Development'));
    
    const requestCard = screen.getByText('React Development').closest('div')!;
    await user.click(requestCard);
    
    await waitFor(() => screen.getByLabelText('Admin Feedback (Required for Rejection)'));
    
    await user.type(screen.getByLabelText('Admin Feedback (Required for Rejection)'), 'Insufficient proof');
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/skill-verification-requests/req-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            status: 'rejected',
            skillId: 'skill-1',
            feedback: 'Insufficient proof'
          })
        })
      );
    });
  });

  test('views a document', async () => {
    const user = userEvent.setup();
    render(<VerificationRequests />);
    
    await waitFor(() => screen.getByText('React Development'));
    
    const requestCard = screen.getByText('React Development').closest('div')!;
    await user.click(requestCard);
    
    await waitFor(() => screen.getByText('Uploaded Documents'));
    
    const viewButtons = screen.getAllByRole('button', { name: 'View' });
    await user.click(viewButtons[0]);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/documents/access',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ url: 'doc1.pdf' })
        })
      );
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith('mock-url', '_blank');
    });
  });

  test('handles fetch errors gracefully', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Network error'))
    );
    
    render(<VerificationRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('Unable to load requests')).toBeInTheDocument();
      expect(screen.getByText('Please try refreshing.')).toBeInTheDocument();
    });
  });

  test('shows empty state when no requests found', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      } as unknown as Response)
    );
    
    render(<VerificationRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('No requests found')).toBeInTheDocument();
      expect(screen.getByText('There are no skill verification requests matching your criteria.')).toBeInTheDocument();
    });
  });

  test('refreshes the request list', async () => {
    const mockFetch = global.fetch as jest.Mock;
    const user = userEvent.setup();
    
    // Reset mock counter
    mockFetch.mockClear();
    
    render(<VerificationRequests />);
    
    // Wait for initial data load to complete
    await waitFor(() => screen.getByText('React Development'));
    
    // Clear mock to reset call count after initial load
    mockFetch.mockClear();
    
    // Click refresh button
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    
    await waitFor(() => {
      // Expect fetch to be called for requests and user data
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/skill-verification-requests');
    });
  });
});

describe('Accessibility', () => {
  test('has proper ARIA attributes', async () => {
    render(<VerificationRequests />);
    
    await waitFor(() => {
      const searchContainer = screen.getByPlaceholderText('Search by name, email, skill...').closest('div');
      expect(searchContainer).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pending' })).not.toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('can navigate with keyboard', async () => {
    const user = userEvent.setup();
    render(<VerificationRequests />);
    
    await waitFor(() => screen.getByText('React Development'));
    
    // Find the first request card and click it
    const requestCard = screen.getByText('React Development').closest('div')!;
    await user.click(requestCard);
    
    await waitFor(() => {
      expect(screen.getByText('Verification Request Details')).toBeInTheDocument();
    });
  });
});

describe('Edge Cases', () => {
  test('handles missing user data', async () => {
    // Create a request with missing name data
    const missingUserRequest = {
      ...mockRequests[0],
      user: { _id: 'user-123', email: 'john@example.com' } // No name fields
    };
    
    const mockFetch = global.fetch as jest.Mock;
    
    // First mock the initial request
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [missingUserRequest] })
      } as unknown as Response)
    );
    
    // Then mock the user profile request to return user without name
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, user: { _id: 'user-123', email: 'john@example.com' } })
      } as unknown as Response)
    );
    
    render(<VerificationRequests />);
    
    await waitFor(() => {
      // Find the paragraph with the user name
      const userNameElement = screen.getByText('Unknown User');
      expect(userNameElement).toBeInTheDocument();
    });
  });

  test('handles empty feedback on rejection', async () => {
    const user = userEvent.setup();
    render(<VerificationRequests />);
    
    await waitFor(() => screen.getByText('React Development'));
    
    const requestCard = screen.getByText('React Development').closest('div')!;
    await user.click(requestCard);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
    });
  });
});