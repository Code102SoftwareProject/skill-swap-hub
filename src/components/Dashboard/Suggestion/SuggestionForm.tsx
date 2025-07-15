/*
  A form to submit user suggestions including title, description, and category.
*/

import { useState } from 'react';
import { z } from 'zod';

type SuggestionFormProps = {
  onSubmit: (data: { title: string; description: string; category: string }) => void;
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

export default function SuggestionForm({ onSubmit }: SuggestionFormProps) {
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
