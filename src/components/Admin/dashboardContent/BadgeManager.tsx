"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Pencil, Trash2, X, Check, RefreshCcw } from "lucide-react";

// API endpoint constants
const API_ENDPOINTS = {
  BADGE: {
    BASE: "/api/badge",
    DELETE: (badgeId: string) => `/api/badge?badgeId=${badgeId}`,
  },
  FILE: {
    UPLOAD: "/api/file/upload",
    RETRIEVE: (file: string) =>
      `/api/file/retrieve?file=${encodeURIComponent(file)}`,
  },
};

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
  if (!url) return "/placeholder-badge.png";

  // Use the retrieve API for badge images
  if (url.startsWith("badges/")) {
    return `/api/file/retrieve?file=${encodeURIComponent(url)}`;
  }

  // For URLs that contain 'badges/' folder but don't start with it
  if (url.includes("badges/")) {
    // Extract the badges path
    const badgesPath = url.substring(url.indexOf("badges/"));
    return `/api/file/retrieve?file=${encodeURIComponent(badgesPath)}`;
  }

  // For external URLs, use them directly
  if (url.startsWith("http")) return url;

  // Default fallback approach
  return `/api/file/retrieve?file=${encodeURIComponent(url)}`;
};

// New helper function for file upload logic
const uploadBadgeImage = async (
  file: File,
  namePrefix: string
): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const safeFileName = `badges/${namePrefix}_${Date.now()}.${fileExt}`;

  const renamedFile = new File([file], safeFileName, {
    type: file.type,
  });

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
  return uploadData.url;
};

// Add these validation utility functions after your existing helper functions
const validateBadgeInput = (
  name: string,
  description: string,
  image: File | null,
  isEdit: boolean
): { isValid: boolean; errorMessage: string } => {
  // Name validation - no empty names and no special characters except spaces and hyphens
  if (!name || name.trim().length === 0) {
    return { isValid: false, errorMessage: "Badge name is required" };
  }

  if (!/^[a-zA-Z0-9\s\-]+$/.test(name)) {
    return {
      isValid: false,
      errorMessage:
        "Badge name should only contain letters, numbers, spaces and hyphens",
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      errorMessage: "Badge name must be less than 50 characters",
    };
  }

  // Description validation - minimum length
  if (!description || description.trim().length === 0) {
    return { isValid: false, errorMessage: "Description is required" };
  }

  if (description.trim().length < 10) {
    return {
      isValid: false,
      errorMessage: "Description must be at least 10 characters long",
    };
  }

  // Image validation - only required for new badges, not edits
  if (!isEdit && !image) {
    return { isValid: false, errorMessage: "Badge image is required" };
  }

  // Use the helper function for image validation if an image is provided
  if (image) {
    const imageValidation = validateImageFile(image);
    if (!imageValidation.isValid) {
      return imageValidation;
    }
  }

  return { isValid: true, errorMessage: "" };
};

// Add this helper function after your other helper functions but before the component

// Helper function to validate image files
const validateImageFile = (
  file: File
): { isValid: boolean; errorMessage: string } => {
  // File type validation
  const validImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!validImageTypes.includes(file.type)) {
    return {
      isValid: false,
      errorMessage: "Invalid image type. Please use JPEG, PNG, GIF or WEBP",
    };
  }

  // File size validation (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      errorMessage: "Image size should be less than 2MB",
    };
  }

  return { isValid: true, errorMessage: "" };
};

export default function BadgeManager() {
  // State for badge list and loading status
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // States for new badge form
  const [badgeName, setBadgeName] = useState("");
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(
    null
  );
  const [criteria, setCriteria] = useState(criteriaOptions[0]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Replace these individual states
  // const [editMode, setEditMode] = useState<string | null>(null);
  // const [editBadgeName, setEditBadgeName] = useState("");
  // const [editCriteria, setEditCriteria] = useState("");
  // const [editDescription, setEditDescription] = useState("");
  // const [editImage, setEditImage] = useState<File | null>(null);
  // const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // With this single state object
  const [editFormState, setEditFormState] = useState<{
    badgeId: string | null;
    name: string;
    criteria: string;
    description: string;
    image: File | null;
    imagePreview: string | null;
  }>({
    badgeId: null,
    name: "",
    criteria: "",
    description: "",
    image: null,
    imagePreview: null,
  });

  // Tracks which images failed to load
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Add form validation state
  const [formError, setFormError] = useState("");
  const [editFormError, setEditFormError] = useState("");

  // Add this near the top of your component, after other state declarations
  const [imageRetryCount, setImageRetryCount] = useState<
    Record<string, number>
  >({});
  const MAX_RETRY_ATTEMPTS = 2;

  // Add this function to your component
  const handleImageRetry = (badgeId: string, imageUrl: string) => {
    // Reset error state for this badge
    setImageErrors((prev) => ({
      ...prev,
      [badgeId]: false,
    }));

    // Reset retry count for this badge
    setImageRetryCount((prev) => ({
      ...prev,
      [badgeId]: 0,
    }));

    // Force component re-render to try loading the image again
    setBadges((prev) => [...prev]);
  };

  // Fetch badges when component loads or refresh is triggered
  useEffect(() => {
    async function fetchBadges() {
      setLoading(true);
      try {
        // Get badge data from API
        const response = await fetch(API_ENDPOINTS.BADGE.BASE);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched badges:", data);

          // Debug logging for image URLs
          data.forEach((badge: Badge) => {
            console.log(
              `Badge ${badge.badgeName} image URL:`,
              badge.badgeImage
            );
          });

          setBadges(data);
          // Reset image errors when we get new badge data
          setImageErrors({});
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
      badges.forEach((badge) => {
        console.log(`${badge.badgeName}: ${badge.badgeImage}`);
      });
    }
  }, [badges]);

  // Update handleImageChange to validate file on selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Use the helper function
      const validation = validateImageFile(file);

      if (!validation.isValid) {
        setFormError(validation.errorMessage);
        e.target.value = ""; // Clear the input
        return;
      }

      // If validation passes, set the image
      setBadgeImage(file);
      setBadgeImagePreview(URL.createObjectURL(file));
      setFormError(""); // Clear any previous errors
    }
  };

  // Update handleEditImageChange to validate file on selection
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Use the helper function
      const validation = validateImageFile(file);

      if (!validation.isValid) {
        setEditFormError(validation.errorMessage);
        e.target.value = ""; // Clear the input
        return;
      }

      // If validation passes, set the image
      setEditFormState({
        ...editFormState,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
      setEditFormError(""); // Clear any previous errors
    }
  };

  // Create new badge
  const handleSubmit = async () => {
    // Reset any previous errors
    setFormError("");

    // Validate inputs
    const validation = validateBadgeInput(
      badgeName,
      description,
      badgeImage,
      false // not an edit
    );

    if (!validation.isValid) {
      setFormError(validation.errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      // Use the helper function for image upload
      const namePrefix = `badge_${badgeName.replace(/\s+/g, "_").toLowerCase()}`;

      // Type check to ensure badgeImage is not null before passing to the function
      if (!badgeImage) {
        throw new Error("Badge image is required");
      }

      const uploadedImageUrl = await uploadBadgeImage(badgeImage, namePrefix);

      // Create badge with the uploaded image URL
      const badgeData = {
        badgeName,
        badgeImage: uploadedImageUrl,
        criteria,
        description,
      };

      const badgeRes = await fetch(API_ENDPOINTS.BADGE.BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      setFormError(""); // Add this to reset any form errors

      // Reset the file input by using a reference or re-rendering trick
      // This will clear the file input field visually
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      setRefreshTrigger((prev) => prev + 1);
      alert("Badge added successfully!");
    } catch (error) {
      console.error(error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize edit mode for a badge
  const startEditMode = (badge: Badge) => {
    setEditFormState({
      badgeId: badge._id,
      name: badge.badgeName,
      criteria: badge.criteria,
      description: badge.description,
      image: null,
      imagePreview: badge.badgeImage,
    });
    setEditFormError(""); // Clear any previous edit errors
  };

  // Exit edit mode
  const cancelEditMode = () => {
    setEditFormState({
      badgeId: null,
      name: "",
      criteria: "",
      description: "",
      image: null,
      imagePreview: null,
    });
  };

  // Update existing badge
  const handleUpdate = async (badgeId: string) => {
    // Reset any previous errors
    setEditFormError("");

    // Validate inputs
    const validation = validateBadgeInput(
      editFormState.name,
      editFormState.description,
      editFormState.image,
      true // is an edit
    );

    if (!validation.isValid) {
      setEditFormError(validation.errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      let badgeImageUrl = null;

      // Upload new image if selected
      if (editFormState.image) {
        // Use the helper function for image upload
        badgeImageUrl = await uploadBadgeImage(
          editFormState.image,
          "badge_update"
        );
      }

      // Prepare update data
      const updateData: any = {
        badgeId,
        badgeName: editFormState.name,
        criteria: editFormState.criteria,
        description: editFormState.description,
      };

      if (badgeImageUrl) {
        updateData.badgeImage = badgeImageUrl;
      }

      console.log("Sending update data:", updateData);

      // Send update request
      const updateRes = await fetch(API_ENDPOINTS.BADGE.BASE, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        throw new Error(`Failed to update badge: ${errorText}`);
      }

      const responseData = await updateRes.json();
      console.log("Update response:", responseData);

      // Update the badge locally instead of relying only on refresh trigger
      setBadges((prevBadges) =>
        prevBadges.map((badge) =>
          badge._id === badgeId
            ? {
                ...badge,
                badgeName: editFormState.name,
                criteria: editFormState.criteria,
                description: editFormState.description,
                ...(badgeImageUrl ? { badgeImage: badgeImageUrl } : {}),
              }
            : badge
        )
      );

      // Reset edit state
      cancelEditMode();

      // Also trigger a refresh to ensure everything is in sync
      setRefreshTrigger((prev) => prev + 1);
      alert("Badge updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
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
      const deleteRes = await fetch(API_ENDPOINTS.BADGE.DELETE(badgeId), {
        method: "DELETE",
      });

      if (!deleteRes.ok) {
        throw new Error("Failed to delete badge");
      }

      // Refresh badge list after deletion
      setRefreshTrigger((prev) => prev + 1);
      alert("Badge deleted successfully!");
    } catch (error) {
      console.error(error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Create a dedicated refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(API_ENDPOINTS.BADGE.BASE);
      if (response.ok) {
        const data = await response.json();
        console.log("Refreshed badges:", data);
        setBadges(data);
      } else {
        console.error("Failed to refresh badges:", await response.text());
      }
    } catch (error) {
      console.error("Error refreshing badges:", error);
    } finally {
      setIsRefreshing(false);
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
            {badges.map((badge) => (
              <li key={`debug-${badge._id}`} className="flex flex-col">
                <span>
                  <strong>{badge.badgeName}</strong>: {badge.badgeImage}
                </span>
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

  // Return only the form and badge management sections
  return (
    <div className="space-y-10">
      {/* Form for adding new badges */}
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold mb-4">Add New Badge</h2>

        {formError && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          {/* Badge name input */}
          <input
            type="text"
            placeholder="Badge Name"
            value={badgeName}
            onChange={(e) => {
              setBadgeName(e.target.value);
              // Clear errors when user starts typing
              if (formError) setFormError("");
            }}
            className="w-full border p-2 rounded"
            maxLength={50}
          />

          {/* Badge criteria selection */}
          <select
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            className="w-full border p-2 rounded"
          >
            {criteriaOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          {/* Badge description */}
          <div>
            <textarea
              placeholder="Badge Description (minimum 10 characters)"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                // Clear errors when user starts typing
                if (formError) setFormError("");
              }}
              className="w-full border p-2 rounded resize-none"
              rows={3}
            />
            <div className="text-xs text-gray-500 mt-1">
              {description.length}/10 characters minimum
            </div>
          </div>

          {/* Image upload with preview */}
          <div className="space-y-2">
            <label className="block">
              Badge Image (JPEG, PNG, GIF, WEBP; max 2MB)
            </label>
            <input
              type="file"
              accept="image/jpeg, image/png, image/gif, image/webp"
              onChange={handleImageChange}
            />
            {badgeImagePreview && (
              <div className="mt-2">
                <Image
                  src={badgeImagePreview}
                  alt="Preview"
                  width={100}
                  height={100}
                  className="rounded"
                />
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-full ${
              isLoading ? "bg-blue-400" : "bg-blue-600"
            } text-white p-2 rounded hover:bg-blue-700 flex justify-center`}
          >
            {isLoading ? "Adding Badge..." : "Add Badge"}
          </button>
        </div>
      </div>

      {/* Section for managing existing badges */}
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

        {/* Show loading state or empty message if needed */}
        {loading ? (
          <div className="text-center py-8">Loading badges...</div>
        ) : badges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No badges available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Map through badges and render each one */}
            {badges.map((badge) => (
              <div
                key={badge._id}
                className="border rounded-lg overflow-hidden"
              >
                <div className="flex items-start p-4">
                  {/* Badge image container */}
                  <div className="w-16 h-16 relative mr-4 flex-shrink-0">
                    {imageErrors[badge._id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded border border-gray-200">
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">⚠️</div>
                          <span className="text-xs text-gray-500">
                            Image unavailable
                          </span>
                        </div>
                        <button
                          className="mt-1 text-xs text-blue-500 hover:text-blue-700"
                          onClick={() =>
                            handleImageRetry(badge._id, badge.badgeImage)
                          }
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Badge image with error handling */}
                        <Image
                          src={
                            editFormState.badgeId === badge._id &&
                            editFormState.imagePreview
                              ? editFormState.imagePreview
                              : getFullImageUrl(badge.badgeImage)
                          }
                          alt={badge.badgeName}
                          className="rounded object-cover"
                          fill
                          sizes="64px"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            const badgeId = badge._id;
                            const currentRetries =
                              imageRetryCount[badgeId] || 0;

                            console.error(
                              `Failed to load image for badge ${badge.badgeName} (Attempt ${currentRetries + 1})`
                            );
                            console.error(`URL attempted: ${target.src}`);

                            // Update retry count
                            setImageRetryCount((prev) => ({
                              ...prev,
                              [badgeId]: currentRetries + 1,
                            }));

                            // Try different URL patterns if we haven't exceeded max retries
                            if (currentRetries < MAX_RETRY_ATTEMPTS) {
                              let retryUrl;

                              // Different retry strategies based on retry count
                              if (
                                currentRetries === 0 &&
                                badge.badgeImage &&
                                badge.badgeImage.includes("badges/")
                              ) {
                                // First retry: Try direct file path
                                const badgePath = badge.badgeImage.substring(
                                  badge.badgeImage.indexOf("badges/")
                                );
                                retryUrl = `/api/file/retrieve?file=${encodeURIComponent(
                                  badgePath
                                )}`;
                              } else if (currentRetries === 1) {
                                // Second retry: Try with different cache parameter
                                retryUrl = `${API_ENDPOINTS.FILE.RETRIEVE(
                                  badge.badgeImage
                                )}?nocache=${Date.now()}`;
                              }

                              if (retryUrl) {
                                console.log(`Retrying with URL: ${retryUrl}`);
                                target.src = retryUrl;
                                return; // Don't mark as error yet
                              }
                            }

                            // If we've exhausted retries or have no valid retry strategy, mark as failed
                            setImageErrors((prev) => ({
                              ...prev,
                              [badgeId]: true,
                            }));
                          }}
                          priority={true}
                        />
                      </>
                    )}
                  </div>

                  {/* Badge details and actions */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{badge.badgeName}</h3>

                    {editFormState.badgeId === badge._id ? (
                      // Edit form for badge
                      <>
                        {editFormError && (
                          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4 mx-4 text-sm">
                            {editFormError}
                          </div>
                        )}
                        <div className="space-y-2 mt-2">
                          {/* Badge name editing */}
                          <input
                            type="text"
                            placeholder="Badge Name"
                            value={editFormState.name}
                            onChange={(e) => {
                              setEditFormState({
                                ...editFormState,
                                name: e.target.value,
                              });
                              if (editFormError) setEditFormError("");
                            }}
                            className="w-full border p-2 rounded text-sm"
                            maxLength={50}
                          />

                          {/* Criteria selection */}
                          <select
                            value={editFormState.criteria}
                            onChange={(e) =>
                              setEditFormState({
                                ...editFormState,
                                criteria: e.target.value,
                              })
                            }
                            className="w-full border p-2 rounded text-sm"
                          >
                            {criteriaOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>

                          {/* Description editing */}
                          <div>
                            <textarea
                              value={editFormState.description}
                              onChange={(e) => {
                                setEditFormState({
                                  ...editFormState,
                                  description: e.target.value,
                                });
                                if (editFormError) setEditFormError("");
                              }}
                              className="w-full border p-2 rounded text-sm resize-none"
                              rows={3}
                              placeholder="Badge Description (minimum 10 characters)"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {editFormState.description.length}/10 characters
                              minimum
                            </div>
                          </div>

                          {/* Image upload */}
                          <div>
                            <label className="block text-xs mb-1">
                              Badge Image (JPEG, PNG, GIF, WEBP; max 2MB)
                            </label>
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/gif, image/webp"
                              onChange={handleEditImageChange}
                              className="text-sm"
                            />
                          </div>

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
                        <div className="text-sm text-blue-600 mb-1">
                          {badge.criteria}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {badge.description}
                        </p>

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
    </div>
  );
}
