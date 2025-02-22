"use client"
import { useEffect, useState } from 'react';

type Suggestion = {
  _id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export default function AdminDashboard() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const fetchSuggestions = async () => {
    const res = await fetch('/api/suggestions');
    const data: Suggestion[] = await res.json();
    setSuggestions(data);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
  
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
  
      // Refresh the suggestions list after update
      fetchSuggestions();
    } catch (error) {
      console.error('Update failed:', error);
      // Add error notification here
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Suggestions</h1>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion._id} className="p-4 border rounded">
            <h2 className="text-xl font-semibold">{suggestion.title}</h2>
            <p className="text-gray-600">{suggestion.description}</p>
            <p className="text-sm mt-2">
              Status: <span className="font-medium">{suggestion.status}</span>
            </p>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => updateStatus(suggestion._id, 'Approved')}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(suggestion._id, 'Rejected')}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}