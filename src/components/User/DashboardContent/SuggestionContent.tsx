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

// Status options for filtering
const statusOptions = [
  { value: "all", label: "All Suggestions" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function SuggestionContent() {
  const { user } = useAuth();
  const userId = user?._id;
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter suggestions based on selected status
  const filteredSuggestions = statusFilter === "all" 
    ? suggestions 
    : suggestions.filter(suggestion => 
        suggestion.status.toLowerCase() === statusFilter
      );

  // Handle new suggestion submission
  const handleSubmit = async (suggestion: NewSuggestion) => {
    if (!userId) return;
    try {
      await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...suggestion, userId }),
      });

      // Re-fetch suggestions after submission and switch to history tab
      setLoading(true);
      setError("");
      setActiveTab("history");

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

  // Fetch suggestions
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
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === "form"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("form")}
          >
            Submit Suggestion
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeTab === "history"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Your History
          </button>
        </div>

{/* Form Tab Content */}
{activeTab === "form" && (
  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-50 to-white px-6 pt-6 pb-4 border-b border-gray-100">
      <h1 className="text-2xl font-bold text-gray-900">
        Share Your Suggestions
        <span className="block w-20 h-1 bg-blue-500 mt-2 rounded-full"></span>
      </h1>
      <p className="text-sm text-gray-600 mt-2">
        Help us improve by submitting ideas, reporting issues, or asking questions.
      </p>
    </div>

    {/* Form Content */}
    <div className="relative px-6 pb-6">
      {/* Subtle Divider */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>

      <div className="mt-6 p-4">
        <SuggestionForm onSubmit={handleSubmit} />
      </div>
    </div>
  </div>
)}

{/* History Tab Content */}
{activeTab === "history" && (
  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
    {/* Header */}
    <div className="bg-gradient-to-r from-blue-50 to-white px-6 pt-6 pb-4 border-b border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Suggestion History
             <span className="ml-2 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
      {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'item' : 'items'}
    </span>
  </h2>
  <span className="block w-20 h-1 bg-blue-500 mt-2 rounded-full"></span>
          
          <p className="text-sm text-gray-600 mt-1">
            Review your previous suggestions and their status.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="relative w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    {/* Content Area */}
    <div className="p-6">
      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-sm text-gray-500">Loading your feedback...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {!loading && filteredSuggestions.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {statusFilter === "all" ? "No suggestions yet" : `No ${statusFilter} suggestions`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter === "all"
              ? "Get started by submitting your first suggestion."
              : "Try adjusting your filter criteria."}
          </p>
        </div>
      )}

      {!loading && filteredSuggestions.length > 0 && (
        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {filteredSuggestions.map((sugg) => (
            <SuggestionCard key={sugg._id} suggestion={sugg} />
          ))}
        </div>
      )}
    </div>
  </div>
)}

      </main>
    </div>
  );
}