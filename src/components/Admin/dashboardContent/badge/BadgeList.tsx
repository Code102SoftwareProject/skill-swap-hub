"use client";

import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Badge, API_ENDPOINTS } from "./badgeHelpers";
import BadgeCard from "./BadgeCard";

interface BadgeListProps {
  badges: Badge[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdate: (updatedBadge: Badge) => void;
  onDelete: (badgeId: string) => void;
}

const BadgeList = ({
  badges,
  isLoading,
  onRefresh,
  onUpdate,
  onDelete,
}: BadgeListProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Handle manual refresh of badges
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Badges</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-1 text-blue-600 hover:text-blue-800 ${
            isRefreshing ? "opacity-50" : ""
          }`}
        >
          <RefreshCcw
            size={16}
            className={isRefreshing ? "animate-spin" : ""}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading badges...</div>
      ) : badges.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No badges available
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {badges.map((badge) => (
            <BadgeCard
              key={badge._id}
              badge={badge}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgeList;
