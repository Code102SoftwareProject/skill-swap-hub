// Renders a History of suggestion card with badges for category and status
"use client";
import {
    AlertTriangle,
    Sparkles ,
    Lightbulb,
    Tag,
  } from "lucide-react";
import { ReactElement } from "react";


  
  type Suggestion = {
    _id: string;
    title: string;
    description: string;
    category: string;
    status: string;
  }; 
  
  // Category icon styles
  const categoryStyles: Record<string, string> = {
    issue: "bg-red-100 text-red-800",
    suggestion: "bg-blue-100 text-blue-800",
    "feature request": "bg-green-100 text-green-800",
    other: "bg-gray-100 text-gray-800",
  };
  
  // Category icons
  const categoryIcons: Record<string, ReactElement> = {
    issue: <AlertTriangle className="w-4 h-4 mr-1" />,
    suggestion: <Sparkles  className="w-4 h-4 mr-1" />,
    "feature request": <Lightbulb className="w-4 h-4 mr-1" />,
    other: <Tag className="w-4 h-4 mr-1" />,
    default: <Tag className="w-4 h-4 mr-1" />,
  };
  

  
  // Status icon styles
  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    partial: "bg-blue-100 text-blue-800",
    delivered: "bg-purple-100 text-purple-800",
  };
  
  export default function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
    const { title, description, category, status } = suggestion;
    const catKey = category?.toLowerCase().trim();
    const statKey = status?.toLowerCase().trim();
    
  
    return (
      <article className="p-5 rounded-xl shadow-sm bg-white border border-gray-200 transition hover:shadow-md">
        <header className="mb-3">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-gray-600">{description}</p>
        </header>
  
        <div className="flex justify-between items-center text-sm mt-4">
          {/* Category Badge */}
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
              categoryStyles[catKey] || "bg-gray-100 text-gray-800"
            }`}
          >
            {categoryIcons[catKey] || categoryIcons[""]}
            {category}
          </div>
  
          {/* Status Badge */}
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
              statusStyles[statKey] || "bg-gray-100 text-gray-800"
            }`}
          >
            {status}
          </span>
        </div>
      </article>
    );
  }
  