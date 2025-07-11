"use client";

import { useState, useEffect } from "react";
import { Badge, API_ENDPOINTS } from "./badge/badgeHelpers";
import BadgeForm from "./badge/BadgeForm";
import BadgeList from "./badge/BadgeList";

/**
 * BadgeManager component
 * Orchestrates the badge management system by coordinating state and data flow
 * between the badge form, badge list, and server API
 */
export default function BadgeManager() {
  // State for badges list and loading indicators
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Fetch badges from the API
   */
  const fetchBadges = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.BADGE.BASE);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched badges:", data);
        setBadges(data);
      } else {
        console.error("Failed to fetch badges:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle badge update
   * @param updatedBadge - The updated badge data
   */
  const handleBadgeUpdate = (updatedBadge: Badge) => {
    setBadges((prevBadges) =>
      prevBadges.map((badge) =>
        badge._id === updatedBadge._id ? updatedBadge : badge
      )
    );

    // Refresh badges to ensure consistency
    setRefreshTrigger((prev) => prev + 1);
  };

  /**
   * Handle badge deletion
   * @param badgeId - ID of the badge to delete
   */
  const handleBadgeDelete = async (badgeId: string) => {
    try {
      const deleteRes = await fetch(API_ENDPOINTS.BADGE.DELETE(badgeId), {
        method: "DELETE",
      });

      if (!deleteRes.ok) {
        throw new Error("Failed to delete badge");
      }

      // Remove badge from the list
      setBadges((prevBadges) =>
        prevBadges.filter((badge) => badge._id !== badgeId)
      );

      alert("Badge deleted successfully!");
    } catch (error) {
      console.error(error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
    }
  };

  /**
   * Handle badge refresh
   */
  const handleRefresh = async () => {
    await fetchBadges();
  };

  /**
   * Handle new badge added
   */
  const handleBadgeAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Fetch all badges when component mounts or refresh is triggered
  useEffect(() => {
    fetchBadges();
  }, [refreshTrigger]);

  // Log badge image URLs when badges change (debugging helper)
  useEffect(() => {
    if (badges.length > 0) {
      console.log("Current badge image URLs:");
      badges.forEach((badge) => {
        console.log(`${badge.badgeName}: ${badge.badgeImage}`);
      });
    }
  }, [badges]);

  return (
    <div className="space-y-10">
      {/* Add New Badge Form */}
      <BadgeForm onBadgeAdded={handleBadgeAdded} />

      {/* Badge Management Section */}
      <BadgeList
        badges={badges}
        isLoading={loading}
        onRefresh={handleRefresh}
        onUpdate={handleBadgeUpdate}
        onDelete={handleBadgeDelete}
      />
    </div>
  );
}
