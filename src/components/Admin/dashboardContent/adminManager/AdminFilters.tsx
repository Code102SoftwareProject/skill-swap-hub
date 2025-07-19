"use client";

// ─── TOP-LEVEL CONSTANTS ────────────────────────────────────────────────
// Role identifiers used in filters
const ROLE_SUPER_ADMIN = "super_admin";
const ROLE_ADMIN = "admin";
const ROLE_ALL = "all";

// ─── IMPORTS ────────────────────────────────────────────────────────────
import { Filter, Search } from "lucide-react";

// ─── PROPS DEFINITION ────────────────────────────────────────────────────
// Defines the shape of props passed into the filter component
interface AdminFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterRole: string;
  onRoleChange: (value: string) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────
export default function AdminFilters({
  searchTerm,
  onSearchChange,
  filterRole,
  onRoleChange,
}: AdminFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      {/* Wrapper for search input and role dropdown */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search box */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            {/* Search icon inside input */}
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Role filter dropdown */}
        <div className="flex items-center space-x-2">
          {/* Filter icon next to dropdown */}
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterRole}
            onChange={e => onRoleChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={ROLE_ALL}>All Roles</option>
            <option value={ROLE_SUPER_ADMIN}>Super Admin</option>
            <option value={ROLE_ADMIN}>Admin</option>
          </select>
        </div>
      </div>
    </div>
  );
}
