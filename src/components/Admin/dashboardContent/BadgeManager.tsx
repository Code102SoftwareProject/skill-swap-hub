'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { Pencil, Trash2, X, Check, RefreshCcw } from "lucide-react";

// Define the Badge interface for type safety
interface Badge {
  _id: string;
  badgeName: string;
  badgeImage: string;
  criteria: string;
  description: string;
}

// Available criteria options for badge categorization
const criteriaOptions = [
  "Achievement Milestone Badges",
  "Specific Badges",
  "Engagement and Activity Badges",
  "Exclusive Recognition Badges",
];

// Helper function to ensure image URLs are properly formatted
const getFullImageUrl = (url: string) => {
  if (!url) return '/placeholder-badge.png';
  
  // Use the retrieve API for badge images
  if (url.startsWith('badges/')) {
    return `/api/file/retrieve?file=${encodeURIComponent(url)}`;
  }
  
  // For URLs that contain 'badges/' folder but don't start with it
  if (url.includes('badges/')) {
    // Extract the badges path
    const badgesPath = url.substring(url.indexOf('badges/'));
    return `/api/file/retrieve?file=${encodeURIComponent(badgesPath)}`;
  }
  
  // For external URLs, use them directly
  if (url.startsWith('http')) return url;
  
  // Default fallback approach
  return `/api/file/retrieve?file=${encodeURIComponent(url)}`;
};

export default function BadgeManager() {
  // State for badge list and loading status
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // States for new badge form
  const [badgeName, setBadgeName] = useState("");
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(null);
  const [criteria, setCriteria] = useState(criteriaOptions[0]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // States for badge editing
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editCriteria, setEditCriteria] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  
  // Tracks which images failed to load
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Fetch badges when component loads or refresh is triggered
  useEffect(() => {
    async function fetchBadges() {
      setLoading(true);
      try {
        // Get badge data from API
        const response = await fetch("/api/badge");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched badges:", data);
          
          // Debug logging for image URLs
          data.forEach((badge: Badge) => {
            console.log(`Badge ${badge.badgeName} image URL:`, badge.badgeImage);
          });
          
          setBadges(data);
        } else {
          console.error("Failed to fetch badges:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching badges:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, [refreshTrigger]);

  // Additional debugging for badge images
  useEffect(() => {
    if (badges.length > 0) {
      console.log("Current badge image URLs:");
      badges.forEach(badge => {
        console.log(`${badge.badgeName}: ${badge.badgeImage}`);
      });
    }
  }, [badges]);

  // Handle file selection for new badge
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBadgeImage(file);
      setBadgeImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle file selection for badge editing
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // Create new badge
  const handleSubmit = async () => {
    if (!badgeName || !badgeImage || !description) {
      alert("Please fill all fields!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare filename with proper path prefix
      const fileExt = badgeImage.name.split('.').pop();
      const safeFileName = `badges/badge_${badgeName.replace(/\s+/g, '_').toLowerCase()}.${fileExt}`;
      const renamedFile = new File([badgeImage], safeFileName, { type: badgeImage.type });
      
      // Upload the badge image file
      const uploadFormData = new FormData();
      uploadFormData.append("file", renamedFile);
      const uploadResponse = await fetch("/api/file/upload", {
        method: "POST",
        body: uploadFormData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const uploadData = await uploadResponse.json();
      
      // Create badge with the uploaded image URL
      const badgeData = {
        badgeName,
        badgeImage: uploadData.url,
        criteria,
        description
      };

      const badgeRes = await fetch("/api/badge", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(badgeData),
      });

      if (!badgeRes.ok) {
        const errorText = await badgeRes.text();
        throw new Error(`Failed to create badge: ${errorText}`);
      }

      // Reset form and refresh badge list
      setBadgeName("");
      setBadgeImage(null);
      setBadgeImagePreview(null);
      setDescription("");
      setCriteria(criteriaOptions[0]);
      setRefreshTrigger(prev => prev + 1);
      alert("Badge added successfully!");
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize edit mode for a badge
  const startEditMode = (badge: Badge) => {
    setEditMode(badge._id);
    setEditCriteria(badge.criteria);
    setEditDescription(badge.description);
    setEditImagePreview(badge.badgeImage);
    setEditImage(null);
  };

  // Exit edit mode
  const cancelEditMode = () => {
    setEditMode(null);
    setEditImage(null);
    setEditImagePreview(null);
  };

  // Update existing badge
  const handleUpdate = async (badgeId: string) => {
    setIsLoading(true);
    
    try {
      let badgeImageUrl = null;
      
      // Upload new image if selected
      if (editImage) {
        const fileExt = editImage.name.split('.').pop();
        const safeFileName = `badges/badge_update_${Date.now()}.${fileExt}`;
        const renamedFile = new File([editImage], safeFileName, { type: editImage.type });
        
        const uploadFormData = new FormData();
        uploadFormData.append("file", renamedFile);
        const uploadResponse = await fetch("/api/file/upload", {
          method: "POST",
          body: uploadFormData,
        });
        
        const uploadData = await uploadResponse.json();
        badgeImageUrl = uploadData.url;
      }
      
      // Prepare update data
      const updateData: any = {
        badgeId,
        criteria: editCriteria,
        description: editDescription
      };
      
      if (badgeImageUrl) {
        updateData.badgeImage = badgeImageUrl;
      }

      // Send update request
      const updateRes = await fetch("/api/badge", {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to update badge");
      }

      // Reset edit state and refresh badges
      setEditMode(null);
      setEditImage(null);
      setEditImagePreview(null);
      setRefreshTrigger(prev => prev + 1);
      alert("Badge updated successfully!");
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a badge
  const handleDelete = async (badgeId: string) => {
    if (!confirm("Are you sure you want to delete this badge?")) return;
    
    setIsLoading(true);
    
    try {
      // Send delete request to API
      const deleteRes = await fetch(`/api/badge?badgeId=${badgeId}`, {
        method: "DELETE",
      });

      if (!deleteRes.ok) {
        throw new Error("Failed to delete badge");
      }

      // Refresh badge list after deletion
      setRefreshTrigger(prev => prev + 1);
      alert("Badge deleted successfully!");
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug display for badge data (shown only in non-production)
  const debugBadges = () => {
    return (
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Debug Badge Data</h3>
        <div className="mb-4">
          <h4 className="font-semibold">Image URLs:</h4>
          <ul className="text-xs space-y-1">
            {badges.map(badge => (
              <li key={`debug-${badge._id}`} className="flex flex-col">
                <span><strong>{badge.badgeName}</strong>: {badge.badgeImage}</span>
                <span className="text-blue-600">
                  Processed URL: {getFullImageUrl(badge.badgeImage)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <pre className="whitespace-pre-wrap text-xs overflow-auto">
          {JSON.stringify(badges, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Form for adding new badges */}
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold mb-4">Add New Badge</h2>

        <div className="space-y-2">
          {/* Badge name input */}
          <input
            type="text"
            placeholder="Badge Name"
            value={badgeName}
            onChange={(e) => setBadgeName(e.target.value)}
            className="w-full border p-2 rounded"
          />

          {/* Badge criteria selection */}
          <select
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            className="w-full border p-2 rounded"
          >
            {criteriaOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          {/* Badge description */}
          <textarea
            placeholder="Badge Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded resize-none"
            rows={3}
          />

          {/* Image upload with preview */}
          <div className="space-y-2">
            <label className="block">Badge Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {badgeImagePreview && (
              <div className="mt-2">
                <Image src={badgeImagePreview} alt="Preview" width={100} height={100} className="rounded" />
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600'} text-white p-2 rounded hover:bg-blue-700 flex justify-center`}
          >
            {isLoading ? 'Adding Badge...' : 'Add Badge'}
          </button>
        </div>
      </div>

      {/* Section for managing existing badges */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Badges</h2>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        {/* Show loading state or empty message if needed */}
        {loading ? (
          <div className="text-center py-8">Loading badges...</div>
        ) : badges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No badges available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Map through badges and render each one */}
            {badges.map(badge => (
              <div key={badge._id} className="border rounded-lg overflow-hidden">
                <div className="flex items-start p-4">
                  {/* Badge image container */}
                  <div className="w-16 h-16 relative mr-4 flex-shrink-0">
                    {imageErrors[badge._id] ? (
                      // Fallback for failed images
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                        <span className="text-xs text-gray-500">No image</span>
                      </div>
                    ) : (
                      <>
                        {/* Badge image with error handling */}
                        <Image 
                          src={editMode === badge._id && editImagePreview 
                            ? editImagePreview 
                            : getFullImageUrl(badge.badgeImage)} 
                          alt={badge.badgeName}
                          className="rounded object-cover"
                          fill
                          sizes="64px"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            console.error(`Failed to load image for badge ${badge.badgeName}`);
                            console.error(`URL attempted: ${target.src}`);
                            console.error(`Original badge URL: ${badge.badgeImage}`);
                            // Mark this specific badge image as having an error
                            setImageErrors(prev => ({ ...prev, [badge._id]: true }));
                            
                            // Attempt to retry with a direct URL if it looks like a path
                            if (badge.badgeImage && badge.badgeImage.startsWith('badges/') && !target.src.includes('?retry=true')) {
                              const retryUrl = `/api/file/retrieve?file=${encodeURIComponent(badge.badgeImage)}&retry=true`;
                              target.src = retryUrl;
                            }
                          }}
                          priority={true}
                        />
                      </>
                    )}
                  </div>
                  
                  {/* Badge details and actions */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{badge.badgeName}</h3>
                    
                    {editMode === badge._id ? (
                      // Edit form for badge
                      <>
                        <div className="space-y-2 mt-2">
                          {/* Criteria selection */}
                          <select
                            value={editCriteria}
                            onChange={(e) => setEditCriteria(e.target.value)}
                            className="w-full border p-2 rounded text-sm"
                          >
                            {criteriaOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          
                          {/* Description editing */}
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full border p-2 rounded text-sm resize-none"
                            rows={3}
                          />
                          
                          {/* Image upload */}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleEditImageChange}
                            className="text-sm"
                          />
                          
                          {/* Action buttons */}
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleUpdate(badge._id)}
                              disabled={isLoading}
                              className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              <Check size={16} className="mr-1" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditMode}
                              disabled={isLoading}
                              className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                            >
                              <X size={16} className="mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Badge details view
                      <>
                        <div className="text-sm text-blue-600 mb-1">{badge.criteria}</div>
                        <p className="text-gray-600 text-sm">{badge.description}</p>
                        
                        {/* Action buttons */}
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => startEditMode(badge)}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                          >
                            <Pencil size={14} className="mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(badge._id)}
                            className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Debug section shown only in development */}
      {process.env.NODE_ENV !== 'production' && debugBadges()}
    </div>
  );
}
