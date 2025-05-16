/*
  A form to submit user suggestions including title, description, and category.
 */
import { useState } from 'react';

type SuggestionFormProps = {
  onSubmit: (data: { title: string; description: string; category: string }) => void;
};

export default function SuggestionForm({ onSubmit }: SuggestionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, category });
    setTitle('');
    setDescription('');
    setCategory('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
      <div className='space-y-2'>
        <label htmlFor='title'>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Enter a title'
          className="mt-1 p-2 w-full border rounded"
          required
        />
      </div>
      <div className='space-y-2'>
        <label htmlFor='description'>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Write your description here'
          className="min-h-[120px] mt-1 p-2 w-full border rounded"
          minLength={200}
          required
        />
      </div>
      <div className='space-y-2'>
        <label className="block text-sm font-medium">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 p-2 w-full border rounded text-gray-4800"
          
          required
        >
          <option value="">Select a category</option>
          <option value="Issue">Issue</option>
          <option value="Suggestion">Suggestion</option>
          <option value="Feature Request">Feature Request</option>
          <option value="Other">Other</option>
        </select>
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