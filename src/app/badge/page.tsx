"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";

// Define Badge interface for type checking
interface Badge {
  _id: string;           // Unique identifier for the badge
  badgeName: string;     // Display name
  badgeImage: string;    // URL to badge image
  criteria: string;      // Category/criteria 
  description: string;   // Description of badge requirements
}

// Categories for filtering badges
const categories = [
  "All",
  "Achievement Milestone Badges",
  "Specific Badges",
  "Engagement and Activity Badges",
  "Exclusive Recognition Badges",
];

export default function BadgesPage() {
  // State for storing badges data
  const [badges, setBadges] = useState<Badge[]>([]);
  // State for tracking currently selected filter category
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    // Fetch badges data from API when component mounts
    const fetchBadges = async () => {
      try {
        // Get badges from server API endpoint
        const response = await axios.get("/api/badge");
        setBadges(response.data);
        console.log("Badges data:", response.data);
      } catch (error) {
        console.error("Error fetching badges:", error);
      }
    };

    fetchBadges();
  }, []);

  // Helper function to get image URL from the retrieve endpoint
  const getImageUrl = (badgeImage: string) => {
    if (!badgeImage) return "/default-badge.png";
    
    // Check if badgeImage is already a full URL
    if (badgeImage.startsWith("http")) {
      return `/api/file/retrieve?fileUrl=${encodeURIComponent(badgeImage)}`;
    }
    
    // If it's just a filename
    return `/api/file/retrieve?file=${encodeURIComponent(badgeImage)}`;
  };

  // Filter badges based on selected category
  const filteredBadges = selectedCategory === "All"
    ? badges
    : badges.filter((badge) => badge.criteria.includes(selectedCategory.split(" ")[0]));

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      {/* Page header */}
      <h1 className="text-3xl font-bold mb-8 text-center">Badges</h1>
      
      {/* Category filter dropdown */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <label htmlFor="category" className="text-lg font-medium text-gray-700">Category:</label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 rounded-lg border border-gray-300"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      {/* Grid layout for badge cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredBadges.map((badge) => (
          <div
            key={badge._id}
            className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition"
          >
            {/* Badge image container */}
            <div className="w-24 h-24 relative mb-4">
              <Image
                src={getImageUrl(badge.badgeImage)}
                alt={badge.badgeName}
                width={96}
                height={96}
                priority
                className="rounded-full object-contain"
                onError={(e) => {
                  // Fallback to a default image if loading fails
                  const target = e.target as HTMLImageElement;
                  target.src = "/default-badge.png";
                  console.error(`Failed to load image: ${badge.badgeImage}`);
                }}
              />
            </div>
            {/* Badge details */}
            <h2 className="text-xl font-semibold mb-2">{badge.badgeName}</h2>
            <p className="text-gray-600 text-sm mb-1">{badge.criteria}</p>
            <p className="text-gray-500 text-xs">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
