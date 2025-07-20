/**
 * Admin Forum Reports Tests
 * Test suite for the admin forum report management functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ForumReportsContent from '@/components/Admin/dashboardContent/ForumReportsContent';
import Swal from 'sweetalert2';

// Mock dependencies
jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
    close: jest.fn()
  }
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;
const mockSwal = Swal as jest.Mocked<typeof Swal>;

describe('Admin Forum Reports Component', () => {
  const mockReports = [
    {
      _id: 'report-1',
      postId: {
        _id: 'post-1',
        title: 'Inappropriate Post',
        content: 'This is an inappropriate post content',
        author: { _id: 'user-1' },
        likes: 5,
        dislikes: 10,
        replies: 2,
        views: 100,
        createdAt: '2023-06-15T10:00:00Z'
      },
      reportedBy: {
        _id: 'user-2',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        avatar: 'avatar.jpg'
      },
      reportType: 'inappropriate_content',
      description: 'This post contains inappropriate content',
      status: 'pending',
      priority: 'high',
      aiAnalysis: {
        isAnalyzed: true,
        analysisResult: 'potentially_harmful',
        confidence: 0.85,
        detectedIssues: ['offensive language', 'adult content'],
        summary: 'Post contains potentially offensive content',
        recommendedAction: 'review',
        analysisDate: '2023-06-15T10:30:00Z',
        modelUsed: 'Gemini 2.0'
      },
      postSnapshot: {
        title: 'Inappropriate Post',
        content: 'This is an inappropriate post content',
        authorId: 'user-1',
        authorName: 'John Smith',
        forumId: 'forum-1',
        forumTitle: 'General Discussion',
        capturedAt: '2023-06-15T10:15:00Z'
      },
      createdAt: '2023-06-15T10:15:00Z'
    },
    {
      _id: 'report-2',
      postId: {
        _id: 'post-2',
        title: 'Spam Post',
        content: 'This is spam content',
        author: { _id: 'user-3' },
        likes: 0,
        dislikes: 15,
        replies: 0,
        views: 30,
        createdAt: '2023-06-14T09:00:00Z'
      },
      reportedBy: {
        _id: 'user-4',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com'
      },
      reportType: 'spam',
      description: 'This post is spam',
      status: 'under_review',
      priority: 'medium',
      aiAnalysis: {
        isAnalyzed: true,
        analysisResult: 'harmful',
        confidence: 0.92,
        detectedIssues: ['spam', 'promotional content'],
        summary: 'Post is likely spam',
        recommendedAction: 'remove',
        analysisDate: '2023-06-14T09:30:00Z',
        modelUsed: 'Gemini 2.0'
      },
      adminId: {
        _id: 'admin-1',
        username: 'admin',
        email: 'admin@example.com'
      },
      postSnapshot: {
        title: 'Spam Post',
        content: 'This is spam content',
        authorId: 'user-3',
        authorName: 'Bob Williams',
        forumId: 'forum-1',
        forumTitle: 'General Discussion',
        capturedAt: '2023-06-14T09:15:00Z'
      },
      createdAt: '2023-06-14T09:15:00Z'
    }
  ];

  const mockPagination = {
    currentPage: 1,
    totalPages: 1,
    totalCount: 2,
    hasNext: false,
    hasPrev: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: {
          reports: mockReports,
          pagination: mockPagination,
          statusSummary: {
            pending: 1,
            under_review: 1,
            resolved: 0,
            dismissed: 0,
            auto_resolved: 0
          },
          aiSummary: {
            safe: 0,
            potentially_harmful: 1,
            harmful: 1,
            requires_review: 0
          }
        }
      }),
    } as Response);
  });

  // Test Case 1: Component renders and displays reports
  test('renders forum reports dashboard and displays reports', async () => {
    render(<ForumReportsContent />);
    
    // Check for loading spinner initially
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Wait for reports to load
    await waitFor(() => {
      expect(screen.getByText('Forum Post Reports')).toBeInTheDocument();
    });
    
    // Check that reports are displayed
    expect(screen.getByText('Inappropriate Post')).toBeInTheDocument();
    expect(screen.getByText('Spam Post')).toBeInTheDocument();
    
    // Check that status filters are displayed
    expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Under Review' })).toBeInTheDocument();
    
    // Check that priority badges are displayed
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    
    // Check that AI analysis results are displayed
    expect(screen.getByText('potentially harmful')).toBeInTheDocument();
    expect(screen.getByText('harmful')).toBeInTheDocument();
  });
}); 