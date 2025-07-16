"use client";
import React from "react";
import { Search, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  sortDirection: "asc" | "desc";
  onToggleSort: () => void;
  statusOptions: { value: string; label: string; count: number }[];
}

export function Filters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortDirection,
  onToggleSort,
  statusOptions,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
      {/* Search */}
      <div className="relative max-w-md w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search by name, email, reason , or report ID…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        />
      </div>

      {/* Status dropdown */}
      <select
        value={statusFilter}
        onChange={e => onStatusChange(e.target.value)}
        className="border px-4 py-2 rounded"
      >
        {statusOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label} ({opt.count})
          </option>
        ))}
      </select>

      {/* Sort toggle */}
      <Button
        onClick={onToggleSort}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        title={`Sort by date: ${sortDirection === "desc" ? "newest first" : "oldest first"}`}
      >
        {sortDirection === "desc" ? (
          <SortDesc className="h-4 w-4" />
        ) : (
          <SortAsc className="h-4 w-4" />
        )}
        {sortDirection === "desc" ? "Newest" : "Oldest"}
      </Button>
    </div>
  );
}
