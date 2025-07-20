/**
 * Admin Skill Category Manager Tests
 * Test suite for the skill category management functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import SkillLists from '@/components/Admin/skillList';
import axios from 'axios';
import Swal from 'sweetalert2';

// Mock dependencies
jest.mock('axios');
jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: jest.fn(() => Promise.resolve({ isConfirmed: true })),
    close: jest.fn()
  }
}));

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockSwal = Swal as jest.Mocked<typeof Swal>;

describe('Admin Skill Category Manager Component', () => {
  const mockSkillLists = [
    {
      _id: 'list-1',
      categoryId: 1,
      categoryName: 'Programming Languages',
      skills: [
        { skillId: 'skill-1', name: 'JavaScript' },
        { skillId: 'skill-2', name: 'Python' },
        { skillId: 'skill-3', name: 'Java' }
      ]
    },
    {
      _id: 'list-2',
      categoryId: 2,
      categoryName: 'Design',
      skills: [
        { skillId: 'skill-4', name: 'UI/UX Design' },
        { skillId: 'skill-5', name: 'Graphic Design' }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock responses
    mockAxios.get.mockResolvedValue({
      data: mockSkillLists
    });

    mockAxios.post.mockResolvedValue({
      data: {
        _id: 'list-3',
        categoryId: 3,
        categoryName: 'New Category',
        skills: []
      }
    });

    mockAxios.put.mockResolvedValue({
      data: mockSkillLists[0]
    });

    mockAxios.delete.mockResolvedValue({
      data: { success: true }
    });
  });

  // Test Case 1: Component renders and fetches data
  test('renders the skill category manager and fetches categories', async () => {
    render(<SkillLists />);
    
    // Check loading state is shown initially
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    
    // Verify categories are displayed after loading
    await waitFor(() => {
      expect(screen.getByText('Skill Categories Manager')).toBeInTheDocument();
      expect(screen.getByText('Programming Languages')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
    });
    
    // Verify API was called
    expect(mockAxios.get).toHaveBeenCalledWith('/api/admin/skillLists');
  });

  // Test Case 2: Create a new category
  test('creates a new category successfully', async () => {
    const user = userEvent.setup();
    render(<SkillLists />);
    
    await waitFor(() => {
      expect(screen.getByText('Add New Category')).toBeInTheDocument();
    });
    
    // Fill in the category name
    const categoryNameInput = screen.getByLabelText('Category Name');
    await user.type(categoryNameInput, 'New Category');
    
    // Submit the form
    const addButton = screen.getByRole('button', { name: /\+ Add Category/ });
    await user.click(addButton);
    
    // Verify API call was made with correct data
    expect(mockAxios.post).toHaveBeenCalledWith('/api/admin/skillLists', {
      categoryName: 'New Category',
      skills: []
    });
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText('Category created successfully')).toBeInTheDocument();
    });
  });

  // Test Case 3: Add skills to a category
  test('adds skills to an existing category', async () => {
    const user = userEvent.setup();
    render(<SkillLists />);
    
    await waitFor(() => {
      expect(screen.getByText('Programming Languages')).toBeInTheDocument();
    });
    
    // Select a category
    const selectButton = screen.getAllByRole('button', { name: /Select/ })[0];
    await user.click(selectButton);
    
    // Verify the skills input appears
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e.g. JavaScript, React, Node.js/)).toBeInTheDocument();
    });
    
    // Add skills
    const skillsInput = screen.getByPlaceholderText(/e.g. JavaScript, React, Node.js/);
    await user.type(skillsInput, 'TypeScript, Ruby');
    
    // Submit the form
    const addSkillsButton = screen.getByRole('button', { name: /\+ Add Skills/ });
    await user.click(addSkillsButton);
    
    // Verify API call was made with correct data
    expect(mockAxios.put).toHaveBeenCalledWith(
      '/api/admin/skillLists/1',
      expect.objectContaining({
        categoryName: 'Programming Languages',
        skills: [
          { name: 'TypeScript' },
          { name: 'Ruby' }
        ],
        appendSkills: true
      })
    );
    
    // Check success message
    await waitFor(() => {
      expect(screen.getByText('Skills added successfully')).toBeInTheDocument();
    });
  });

  // Test Case 4: Update category name
  test('updates a category name', async () => {
    const user = userEvent.setup();
    render(<SkillLists />);
    
    await waitFor(() => {
      expect(screen.getByText('Programming Languages')).toBeInTheDocument();
    });
    
    // Click edit button
    const editButtons = screen.getAllByRole('button', { name: /Edit/ });
    await user.click(editButtons[0]);
    
    // Update category name
    const updateInput = screen.getByDisplayValue('Programming Languages');
    await user.clear(updateInput);
    await user.type(updateInput, 'Updated Category Name');
    
    // Submit the update
    const saveButton = screen.getByRole('button', { name: /Update Name/ });
    await user.click(saveButton);
    
    // Verify API call was made with correct data
    expect(mockAxios.put).toHaveBeenCalledWith(
      '/api/admin/skillLists/1',
      expect.objectContaining({
        categoryName: 'Updated Category Name',
        skills: mockSkillLists[0].skills
      })
    );
    
    // Check SweetAlert was shown
    expect(mockSwal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated!',
        icon: 'success'
      })
    );
  });

  // Test Case 5: Delete a category
  test('deletes a category after confirmation', async () => {
    const user = userEvent.setup();
    render(<SkillLists />);
    
    await waitFor(() => {
      expect(screen.getByText('Design')).toBeInTheDocument();
    });
    
    // Click delete button for the second category
    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    await user.click(deleteButtons[1]);
    
    // Verify confirmation dialog was shown
    expect(mockSwal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Are you sure?',
        text: 'You want to delete this skill category?',
        icon: 'warning',
        showCancelButton: true
      })
    );
    
    // Simulate confirmation
    await waitFor(() => {
      // Verify API call was made to delete
      expect(mockAxios.delete).toHaveBeenCalledWith('/api/admin/skillLists/2');
    });
    
    // Verify success message
    expect(mockSwal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Deleted!',
        icon: 'success'
      })
    );
  });
}); 