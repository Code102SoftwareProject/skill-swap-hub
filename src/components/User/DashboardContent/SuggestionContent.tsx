"use client";

import { useEffect, useState } from "react";
import SuggestionForm from "@/components/Dashboard/Suggestion/SuggestionForm";
import SuggestionCard from "@/components/Dashboard/Suggestion/SuggestionCard";
import { useAuth } from "@/lib/context/AuthContext";

// Type definitions
type Suggestion = {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  userId?: string;
};

type NewSuggestion = Omit<Suggestion, "_id" | "status">;

export default function SuggestionContent() {
  const { user } = useAuth();
  const userId = user?._id;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handle new suggestion submission
  const handleSubmit = async (suggestion: NewSuggestion) => {
    if (!userId) return;
    try {
      await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...suggestion, userId }),
      });

      // Re-fetch suggestions after submission
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/suggestions?userId=${userId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Error ${res.status}: ${errorData.details || errorData.error || 'Unknown error'}`);
        }
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Detailed error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch suggestions.");
      } finally {
        setLoading(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  // useEffect with fetch logic inside
  useEffect(() => {
    if (!userId) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/suggestions?userId=${userId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`Error ${res.status}: ${errorData.details || errorData.error || 'Unknown error'}`);
        }
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Detailed error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch suggestions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [userId]);

  if (!userId) {
    return <p className="text-gray-500 italic p-6">Loading user...</p>;
  }

  return (
    <div className="flex-1 text-gray-800">
      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Suggestion Form */}
          <section className="md:col-span-2 bg-white pt-6 px-6 pb-2 rounded-xl shadow-sm border">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              Share Your Suggestions
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Help us improve by submitting ideas, reporting issues, or asking questions.
            </p>
            <SuggestionForm onSubmit={handleSubmit} />
          </section>

          {/* Suggestion History */}
          <aside className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">History</h2>

            {loading && (
              <p className="text-sm text-gray-500 italic">Loading suggestions...</p>
            )}

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            {!loading && suggestions.length === 0 && (
              <p className="text-sm text-gray-500">No suggestions yet.</p>
            )}

            {!loading && suggestions.length > 0 && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {suggestions.map((sugg) => (
                  <SuggestionCard key={sugg._id} suggestion={sugg} />
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
