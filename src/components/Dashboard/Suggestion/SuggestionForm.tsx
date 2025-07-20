/*
  A form to submit user suggestions including title, description, and category.
*/

import { useState } from 'react';
import { z } from 'zod';

type SuggestionFormProps = {
  onSubmit: (data: { title: string; description: string; category: string }) => void;
  isBlocked?: boolean;
  blockReason?: string;
};

// Zod validation schema with smart rules
const SuggestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: 'Title must be at least 3 characters after trimming' })
    .refine(
      (val) => (val.match(/[a-zA-Z]/g)?.length ?? 0) >= 3,
      { message: 'Title must contain at least 3 letters' }
    ),

  description: z
    .string()
    .trim()
    .min(10, { message: 'Description must be at least 10 characters after trimming' })
    .refine(
      (val) => (val.match(/[a-zA-Z]/g)?.length ?? 0) >= 10,
      { message: 'Description must contain at least 10 letters' }
    ),

  category: z.enum(['Issue', 'Suggestion', 'Feature Request', 'Other'], {
    message: 'Please select a category',
  }),
});

export default function SuggestionForm({ onSubmit, isBlocked = false, blockReason }: SuggestionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const [errors, setErrors] = useState<Partial<Record<'title' | 'description' | 'category', string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      title: title.trim(),
      description: description.trim(),
      category,
    };

    const result = SuggestionSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0],
        description: fieldErrors.description?.[0],
        category: fieldErrors.category?.[0],
      });
      return;
    }

    // Clear errors and submit
    setErrors({});
    onSubmit(result.data);
    setTitle('');
    setDescription('');
    setCategory('');
  };

  // If user is blocked, show blocked message instead of form
  if (isBlocked) {
    return (
      <div className="space-y-6 bg-red-50 border border-red-200 p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800">Account Blocked</h3>
            <p className="text-sm text-red-600 mt-1">
              Your account has been blocked from submitting suggestions.
            </p>
          </div>
        </div>
        
        <div className="bg-white border border-red-200 rounded-md p-4">
          <p className="text-sm text-gray-700">
            {blockReason || "Your account has been blocked due to violation of our community guidelines. If you believe this is an error, please contact our support team."}
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            onClick={() => window.location.href = '/contact'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Contact Support
          </button>
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
      <div className="space-y-1">
        <label htmlFor="title" className="block font-medium">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title"
          className={`mt-1 p-2 w-full border rounded ${errors.title ? 'border-red-500' : ''}`}
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block font-medium">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your description here"
          className={`min-h-[120px] mt-1 p-2 w-full border rounded ${errors.description ? 'border-red-500' : ''}`}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="category" className="block font-medium">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`mt-1 p-2 w-full border rounded ${errors.category ? 'border-red-500' : ''}`}
        >
          <option value="">Select a category</option>
          <option value="Issue">Issue</option>
          <option value="Suggestion">Suggestion</option>
          <option value="Feature Request">Feature Request</option>
          <option value="Other">Other</option>
        </select>
        {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Submit Suggestion
      </button>
    </form>
  );
}
