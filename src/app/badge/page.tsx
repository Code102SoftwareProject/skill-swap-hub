"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";

// API endpoints
const API_ENDPOINTS = {
  BADGES: "/api/badge",
  FILE_RETRIEVE: "/api/file/retrieve",
};

// Asset paths
const ASSETS = {
  DEFAULT_BADGE_IMAGE: "/default-badge.png",
};

// Categories for filtering badges
const CATEGORIES = [
  "All",
  "Achievement Milestone Badges",
  "Specific Badges",
  "Engagement and Activity Badges",
  "Exclusive Recognition Badges",
];

// Define Badge interface for type checking
interface Badge {
  _id: string; // Unique identifier for the badge
  badgeName: string; // Display name
  badgeImage: string; // URL to badge image
  criteria: string; // Category/criteria
  description: string; // Description of badge requirements
}

export default function BadgesPage() {
  // State for storing badges data
  const [badges, setBadges] = useState<Badge[]>([]);
  // State for tracking currently selected filter category
  const [selectedCategory, setSelectedCategory] = useState<string>(
    CATEGORIES[0]
  );
  // Add loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Add error state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch badges data from API when component mounts
    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get badges from server API endpoint
        const response = await axios.get(API_ENDPOINTS.BADGES);
        setBadges(response.data);
        console.log("Badges data:", response.data);
      } catch (error) {
        console.error("Error fetching badges:", error);
        setError("Failed to load badges. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, []);

  // Helper function to get image URL from the retrieve endpoint
  const getImageUrl = (badgeImage: string) => {
    if (!badgeImage) return ASSETS.DEFAULT_BADGE_IMAGE;

    // Check if badgeImage is already a full URL
    if (badgeImage.startsWith("http")) {
      return `${API_ENDPOINTS.FILE_RETRIEVE}?fileUrl=${encodeURIComponent(badgeImage)}`;
    }

    // If it's just a filename
    return `${API_ENDPOINTS.FILE_RETRIEVE}?file=${encodeURIComponent(badgeImage)}`;
  };

  // Add a new function that encapsulates image handling with fallback logic
  const BadgeImage = ({ badge }: { badge: Badge }) => {
    const [imageSrc, setImageSrc] = useState(getImageUrl(badge.badgeImage));

    return (
      <Image
        src={imageSrc}
        alt={badge.badgeName}
        width={96}
        height={96}
        priority
        className="rounded-full object-contain"
        onError={() => {
          setImageSrc(ASSETS.DEFAULT_BADGE_IMAGE);
          console.error(`Failed to load image: ${badge.badgeImage}`);
        }}
      />
    );
  };

  // Filter badges based on selected category
  const filteredBadges =
    selectedCategory === CATEGORIES[0]
      ? badges
      : badges.filter((badge) => badge.criteria === selectedCategory);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Page header - Main title for the badges page */}
      <h1 className="text-3xl font-bold mb-8 text-center">Badges</h1>

      {/* 
        Category filter dropdown - Allows users to filter badges by their criteria category
        When a category is selected, the filteredBadges array is updated accordingly
        Disabled during loading state to prevent interaction while data is being fetched
      */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <label htmlFor="category" className="text-lg font-medium text-gray-700">
          Category:
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 rounded-lg border border-gray-300"
          disabled={isLoading}
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Error message - Displayed when API fetch fails */}
      {error && (
        <div className="flex items-center justify-center mb-8">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md max-w-md">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 
        Conditional rendering based on application state:
        1. Loading spinner - Displayed while badges data is being fetched from the API
        2. Empty state message - Shown when no badges match the selected category filter
        3. Badges grid - Displays all matching badges when data is available
      */}
      {isLoading ? (
        /* Loading state - Animated spinner shown while badges are being fetched from the server */
        <div className="flex flex-col items-center justify-center p-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading badges...</p>
        </div>
      ) : filteredBadges.length === 0 && !error ? (
        /* Empty state - Displayed when no badges match the selected category filter */
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm">
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M7 16a7 7 0 1114 0H7z"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium">
            No badges found for this category
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Try selecting a different category filter
          </p>
        </div>
      ) : (
        /* 
          Badges grid - Responsive grid layout that displays all badges matching the selected filter
          Adapts to different screen sizes with responsive column layout
        */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredBadges.map((badge) => (
            <div
              key={badge._id}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition"
            >
              {/* Badge image container - Displays the badge icon with fallback handling */}
              <div className="w-24 h-24 relative mb-4">
                <BadgeImage badge={badge} />
              </div>
              {/* Badge details section - Contains the badge's name, category criteria, and requirements */}
              <h2 className="text-xl font-semibold mb-2">{badge.badgeName}</h2>
              <p className="text-gray-600 text-sm mb-1">{badge.criteria}</p>
              <p className="text-gray-500 text-xs">{badge.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
