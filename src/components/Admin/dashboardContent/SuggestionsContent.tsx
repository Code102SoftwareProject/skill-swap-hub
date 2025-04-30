'use client';

import { useState } from "react";
import { Eye, BarChart2 } from 'lucide-react'; 


interface Suggestion {
  _id: string;
  userName: string;
  userRole: string;
  userImage: string;
  category: string;
  date: string;
  description: string;
  actionType: 'accept-reject' | 'reply';
}

export default function SuggestionsContent() {
  const [searchTerm, setSearchTerm] = useState("");

  const suggestions: Suggestion[] = [
    {
      _id: "1",
      userName: "Balaji Nant",
      userRole: "Lead Product Designer",
      userImage: "https://via.placeholder.com/40",
      category: "Issue",
      date: "2025-04-28",
      description: "Issue with platform loading time",
      actionType: "accept-reject",
    },
    {
      _id: "2",
      userName: "Nithya Manon",
      userRole: "UI Designer",
      userImage: "https://via.placeholder.com/40",
      category: "Feature request",
      date: "2025-04-28",
      description: "Request to add dark mode",
      actionType: "accept-reject",
    },
    {
      _id: "3",
      userName: "Steve Rogers",
      userRole: "Developer",
      userImage: "https://via.placeholder.com/40",
      category: "Question",
      date: "2025-03-26",
      description: "Question about the API",
      actionType: "reply",
    },
    // Add more dummy suggestions...
  ];

  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 mt-7">
      {/* Top Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search"
            className="border rounded-lg p-2 w-64 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
        <button className="flex items-center gap-2 border border-[#026aa1] text-[#026aa1] px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-50 transition">
        <Eye className="w-4 h-4" />
        View Summary
      </button>
      <button className="flex items-center gap-2 border border-[#026aa1] text-[#026aa1] px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-50 transition">
        <BarChart2 className="w-4 h-4" />
        View Analysis
      </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="text-left bg-gray-100">
            <tr>
              <th className="p-3">
                <input type="checkbox" />
              </th>
              <th className="p-3">User</th>
              <th className="p-3">Category</th>
              <th className="p-3">Date</th>
              <th className="p-3">Description</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuggestions.map((suggestion) => (
              <tr key={suggestion._id} className="border-b">
                <td className="p-3">
                  <input type="checkbox" />
                </td>
                <td className="p-3 flex items-center gap-2">
                  <img
                    src={suggestion.userImage}
                    alt={suggestion.userName}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="font-medium">{suggestion.userName}</div>
                    <div className="text-xs text-gray-400">{suggestion.userRole}</div>
                  </div>
                </td>
                <td className="p-3">{suggestion.category}</td>
                <td className="p-3">{suggestion.date}</td>
                <td className="p-3">
                  <button className="text-blue-500 underline text-sm">View</button>
                </td>
                <td className="p-3">
                  {suggestion.actionType === 'accept-reject' ? (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 border-2 border-[#156722] bg-[#c5f3d0] text-[#156722] rounded-lg text-xs">Accept</button>
                      <button className="px-3 py-1 border-2 border-red-500 bg-[#f8e8e8] text-red-500 rounded-lg text-xs">Reject</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 border-2 border-[#026aa1] bg-blue-100 text-[#026aa1] rounded-lg text-xs">Reply</button>
                      <button className="px-3 py-1 border-2 border-red-500 bg-[#f8e8e8] text-red-500 rounded-lg text-xs">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4 text-sm text-gray-500">
        1 - 10 of 52
        <div className="flex ml-4 gap-2">
          <button className="border px-2 rounded-lg">&lt;</button>
          <button className="border px-2 rounded-lg">&gt;</button>
        </div>
      </div>
    </div>
  );
}
