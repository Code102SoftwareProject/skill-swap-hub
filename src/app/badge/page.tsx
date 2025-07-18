"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";

// API endpoint configuration for badge and file operations
const API_ENDPOINTS = {
  BADGES: "/api/badge", // Endpoint for fetching badge data
  FILE_RETRIEVE: "/api/file/retrieve", // Endpoint for retrieving badge images
};

// Default assets used as fallbacks
const ASSETS = {
  DEFAULT_BADGE_IMAGE: "/user-avatar.png", // Default image when badge image fails to load
};

// Badge category options for filtering
const CATEGORIES = [
  "All",
  "Achievement Milestone Badges",
  "Specific Badges",
  "Exclusive Recognition Badges",
];

// Badge data structure definition
interface Badge {
  _id: string; // Unique identifier for the badge
  badgeName: string;
  badgeImage: string; // Image path or URL for the badge
  criteria: string;
  description: string;
}

export default function BadgesPage() {
  // State management
  const [badges, setBadges] = useState<Badge[]>([]); // Stores all badges fetched from API
  const [selectedCategory, setSelectedCategory] = useState<string>( // Tracks selected filter category
    CATEGORIES[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(true); // Tracks loading state
  const [error, setError] = useState<string | null>(null); // Stores error message if request fails

  // Fetch badges data when component mounts
  useEffect(() => {
    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(API_ENDPOINTS.BADGES);

        if (Array.isArray(response.data)) {
          setBadges(response.data);
          console.log("Badges data loaded:", response.data.length, "badges");

          // Log sample badge image paths for debugging
          if (response.data.length > 0) {
            console.log(
              "Sample badge image paths:",
              response.data
                .slice(0, 3)
                .map((b) => b.badgeImage)
                .filter(Boolean)
            );
          }
        } else {
          console.error("Invalid badges data format:", response.data);
          setError("Received invalid data format from server.");
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
        setError("Failed to load badges. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, []);

  /**
   * Constructs proper image URL based on the badge image source
   * Handles both absolute URLs and relative paths
   */
  const getImageUrl = (badgeImage: string) => {
    if (!badgeImage) return ASSETS.DEFAULT_BADGE_IMAGE;

    if (badgeImage.startsWith("http")) {
      return `${API_ENDPOINTS.FILE_RETRIEVE}?fileUrl=${encodeURIComponent(badgeImage)}`;
    }
    return `${API_ENDPOINTS.FILE_RETRIEVE}?file=${encodeURIComponent(badgeImage)}`;
  };

  /**
   * Badge image component with error handling
   * Displays fallback content when image fails to load
   */
  const BadgeImage = ({ badge }: { badge: Badge }) => {
    const [imageSrc, setImageSrc] = useState<string>(
      getImageUrl(badge.badgeImage)
    );
    const [hasError, setHasError] = useState<boolean>(false);

    // Reset image source and error state when badge image changes
    useEffect(() => {
      setImageSrc(getImageUrl(badge.badgeImage));
      setHasError(false);
    }, [badge.badgeImage]);

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Fallback placeholder when image fails to load */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
            <span className="text-2xl font-bold text-gray-400">
              {badge.badgeName.charAt(0)}
            </span>
          </div>
        )}
        <Image
          src={hasError ? ASSETS.DEFAULT_BADGE_IMAGE : imageSrc}
          alt={badge.badgeName}
          width={96}
          height={96}
          priority
          className={`rounded-full object-contain ${hasError ? "opacity-90" : ""}`}
          onError={() => {
            console.log(
              `Falling back to default image for: ${badge.badgeImage}`
            );
            setHasError(true);
          }}
        />
      </div>
    );
  };

  // Filter badges based on selected category
  const filteredBadges =
    selectedCategory === CATEGORIES[0]
      ? badges // Show all badges when "All" is selected
      : badges.filter((badge) => badge.criteria === selectedCategory);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center">Badges</h1>

      {/* Category filter dropdown */}
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

      {/* Error message display */}
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

      {/* Conditional rendering based on loading/content state */}
      {isLoading ? (
        // Loading spinner
        <div className="flex flex-col items-center justify-center p-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading badges...</p>
        </div>
      ) : filteredBadges.length === 0 && !error ? (
        // Empty state when no badges match the filter
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
        // Badge grid display when badges are available
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredBadges.map((badge) => (
            <div
              key={badge._id}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition"
            >
              <div className="w-24 h-24 relative mb-4">
                <BadgeImage badge={badge} />
              </div>
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
