/**
 * Forum Post Reporting Tests
 * Test suite for the forum post reporting functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ReportPostButton from '@/components/communityForum/ReportPostButton';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock alert
global.alert = jest.fn();

describe('ReportPostButton Component', () => {
  const mockPostId = 'post-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Report submitted successfully' }),
    } as Response);
    
    // Mock localStorage to return a token
    mockLocalStorage.getItem.mockReturnValue('mock-jwt-token');
  });

  // Test Case 1: Component renders correctly and opens modal on click
  test('renders report button and opens modal when clicked', async () => {
    const user = userEvent.setup();
    render(<ReportPostButton postId={mockPostId} />);
    
    // Check that the report button is rendered
    const reportButton = screen.getByTitle('Report this post');
    expect(reportButton).toBeInTheDocument();
    
    // Click the report button to open the modal
    await user.click(reportButton);
    
    // Check that the modal is now open
    expect(screen.getByText('Report Post')).toBeInTheDocument();
    expect(screen.getByText('Why are you reporting this post? *')).toBeInTheDocument();
    
    // Check that report type options are displayed
    expect(screen.getByText('Spam or promotional content')).toBeInTheDocument();
    expect(screen.getByText('Harassment or bullying')).toBeInTheDocument();
    expect(screen.getByText('Inappropriate content')).toBeInTheDocument();
    
    // Check that the submit button is disabled initially (no selection made)
    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    expect(submitButton).toBeDisabled();
  });

  // Test Case 2: Successfully submits a report
  test('successfully submits a report with valid data', async () => {
    const user = userEvent.setup();
    render(<ReportPostButton postId={mockPostId} />);
    
    // Open the modal
    await user.click(screen.getByTitle('Report this post'));
    
    // Select a report type
    const inappropriateOption = screen.getByLabelText('Inappropriate content');
    await user.click(inappropriateOption);
    
    // Enter a description
    const descriptionInput = screen.getByPlaceholderText(/Please provide specific details/i);
    await user.type(descriptionInput, 'This post contains offensive language and inappropriate content');
    
    // Submit the report
    const submitButton = screen.getByRole('button', { name: /Submit Report/i });
    expect(submitButton).not.toBeDisabled();
    await user.click(submitButton);
    
    // Check that the API was called with the correct data
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/forum-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token'
        },
        body: JSON.stringify({
          postId: mockPostId,
          reportType: 'inappropriate_content',
          description: 'This post contains offensive language and inappropriate content'
        })
      });
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Report submitted')).toBeInTheDocument();
    });
  });

  // Test Case 3: Handles API errors gracefully
  test('handles API errors when submitting a report', async () => {
    // Mock a failed API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'You have already reported this post' }),
    } as Response);
    
    const user = userEvent.setup();
    render(<ReportPostButton postId={mockPostId} />);
    
    // Open the modal
    await user.click(screen.getByTitle('Report this post'));
    
    // Select a report type
    const spamOption = screen.getByLabelText('Spam or promotional content');
    await user.click(spamOption);
    
    // Enter a description
    const descriptionInput = screen.getByPlaceholderText(/Please provide specific details/i);
    await user.type(descriptionInput, 'This is spam content');
    
    // Submit the report
    await user.click(screen.getByRole('button', { name: /Submit Report/i }));
    
    // Check that the API was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
    
    // Check that the error message was shown
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('You have already reported this post');
    });
    
    // Test network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Try submitting again
    await user.click(screen.getByRole('button', { name: /Submit Report/i }));
    
    // Check that the error message was shown
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to submit report. Please try again.');
    });
  });
}); 