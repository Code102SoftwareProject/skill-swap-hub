"use client"
//import { SideNav } from '@/components/Layout/sideNav';
import SuggestionForm from '@/components/Suggestion/SuggestionForm';
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
    <div className="flex-1 flex text-gray-700">
            

    
            <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h1 className="text-2xl font-semibold mb-6">Add your suggestions.</h1>
              <SuggestionForm onSubmit={handleSubmit} />
            </div>
            <div>
<h2 className="text-2xl font-semibold">History</h2>
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
            </main>
      </div>

    
  );
}