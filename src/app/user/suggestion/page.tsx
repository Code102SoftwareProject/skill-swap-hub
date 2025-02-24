"use client"
import SuggestionForm from '@/components/SuggestionFrom';
import { useEffect, useState } from 'react';

type Suggestion = {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
};

export default function UserDashboard() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const userId = '001'; 

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/suggestions');
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Fetch error:', error);
      // Handle error (e.g., show toast message)
    }
  };

  const handleSubmit = async (suggestion: {
    title: string;
    description: string;
    category: string;
  }) => {
    await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...suggestion, userId }),
    });
    fetchSuggestions();
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Suggestions</h1>
      <SuggestionForm onSubmit={handleSubmit} />
      <div className="mt-8 space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion._id} className="p-4 border rounded">
            <h2 className="text-xl font-semibold">{suggestion.title}</h2>
            <p className="text-gray-600">{suggestion.description}</p>
            <p className="text-sm mt-2">
              Status: <span className="font-medium">{suggestion.status}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}