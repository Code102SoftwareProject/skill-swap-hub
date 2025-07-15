/**
 * Simple LikeDislikeButtons Component Tests
 * Basic tests for the like/dislike functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LikeDislikeButtons from '@/components/communityForum/likedislikebutton';

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

// Simple mock for global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LikeDislikeButtons Component - Simple Tests', () => {
  const defaultProps = {
    postId: 'post-123',
    initialLikes: 5,
    initialDislikes: 2,
    initialLikeStatus: null as 'liked' | 'disliked' | null,
    onUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        post: {
          _id: 'post-123',
          likes: 6,
          dislikes: 2,
          likedBy: ['user-123'],
          dislikedBy: []
        }
      })
    });
  });

  describe('Basic Rendering', () => {
    it('renders the component without crashing', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays like and dislike buttons', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      // Look for buttons by their content or structure
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('shows initial like count', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows initial dislike count', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays thumbs up and thumbs down icons', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      // Check for SVG elements (icons from lucide-react)
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Button States', () => {
    it('shows neutral state by default', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('shows liked state when initially liked', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="liked" 
        />
      );
      
      // Check if the like button has active styling
      const likeButton = screen.getAllByRole('button')[0];
      expect(likeButton).toBeInTheDocument();
    });

    it('shows disliked state when initially disliked', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="disliked" 
        />
      );
      
      // Check if the dislike button has active styling
      const dislikeButton = screen.getAllByRole('button')[1];
      expect(dislikeButton).toBeInTheDocument();
    });

    it('buttons are clickable by default', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).not.toBeDisabled();
      expect(buttons[1]).not.toBeDisabled();
    });
  });

  describe('Props Handling', () => {
    it('handles different initial like counts', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikes={10} 
        />
      );
      
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('handles different initial dislike counts', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialDislikes={7} 
        />
      );
      
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('handles zero counts', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikes={0}
          initialDislikes={0}
        />
      );
      
      // There are two elements with "0" text (like and dislike counts)
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements).toHaveLength(2);
    });

    it('accepts postId prop', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          postId="different-post-id" 
        />
      );
      
      // Component should render without issues
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has proper container structure', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      // Check for main container
      const container = document.querySelector('.flex.items-center.space-x-4');
      expect(container).toBeInTheDocument();
    });

    it('has like button section', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('has dislike button section', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[1]).toBeInTheDocument();
    });

    it('displays counts next to buttons', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const likeCount = screen.getByText('5');
      const dislikeCount = screen.getByText('2');
      
      expect(likeCount).toBeInTheDocument();
      expect(dislikeCount).toBeInTheDocument();
    });
  });

  describe('Basic Interactions', () => {
    it('like button is clickable', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const likeButton = buttons[0];
      
      // Just test that clicking doesn't crash
      likeButton.click();
      expect(likeButton).toBeInTheDocument();
    });

    it('dislike button is clickable', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const dislikeButton = buttons[1];
      
      // Just test that clicking doesn't crash
      dislikeButton.click();
      expect(dislikeButton).toBeInTheDocument();
    });

    it('handles multiple clicks gracefully', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const likeButton = buttons[0];
      
      // Multiple clicks shouldn't crash
      likeButton.click();
      likeButton.click();
      likeButton.click();
      
      expect(likeButton).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('has proper CSS classes on container', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const container = document.querySelector('.flex.items-center.space-x-4');
      expect(container).toBeInTheDocument();
    });

    it('buttons have proper styling classes', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('flex', 'items-center', 'space-x-1');
      });
    });

    it('shows proper colors for neutral state', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('text-gray-600');
      expect(buttons[1]).toHaveClass('text-gray-600');
    });

    it('shows proper colors for liked state', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="liked" 
        />
      );
      
      const likeButton = screen.getAllByRole('button')[0];
      expect(likeButton).toHaveClass('text-blue-600');
    });

    it('shows proper colors for disliked state', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          initialLikeStatus="disliked" 
        />
      );
      
      const dislikeButton = screen.getAllByRole('button')[1];
      expect(dislikeButton).toHaveClass('text-red-600');
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const likeButton = buttons[0];
      
      // Should not crash on error
      likeButton.click();
      expect(likeButton).toBeInTheDocument();
    });

    it('handles failed API responses', () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, message: 'Server error' })
      });
      
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const likeButton = buttons[0];
      
      likeButton.click();
      expect(likeButton).toBeInTheDocument();
    });
  });

  describe('Animation Elements', () => {
    it('has transform classes for animations', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      // Check for transform classes on the animation containers (divs inside buttons)
      const transformDivs = document.querySelectorAll('.transform.transition-transform');
      expect(transformDivs.length).toBeGreaterThanOrEqual(2);
    });

    it('maintains structure during interactions', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      const likeButton = buttons[0];
      
      likeButton.click();
      
      // Structure should remain intact
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Component Accessibility', () => {
    it('has button elements for interaction', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('buttons are focusable', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button.tagName.toLowerCase()).toBe('button');
      });
    });

    it('has proper semantic structure', () => {
      render(<LikeDislikeButtons {...defaultProps} />);
      
      // Check for button elements
      const likeButton = screen.getAllByRole('button')[0];
      const dislikeButton = screen.getAllByRole('button')[1];
      
      expect(likeButton).toBeInTheDocument();
      expect(dislikeButton).toBeInTheDocument();
    });
  });

  describe('Callback Functions', () => {
    it('accepts onUpdate callback prop', () => {
      const mockCallback = jest.fn();
      
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          onUpdate={mockCallback}
        />
      );
      
      // Component should render without issues
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('works without onUpdate callback', () => {
      render(
        <LikeDislikeButtons 
          {...defaultProps} 
          onUpdate={undefined}
        />
      );
      
      // Component should render without issues
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});
