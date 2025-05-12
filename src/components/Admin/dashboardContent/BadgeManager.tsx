"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Pencil, Trash2, X, Check, RefreshCcw } from "lucide-react";

/**
 * API endpoints used throughout the badge management component
 */
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

/**
 * Badge interface representing the data structure of badge objects
 */
interface Badge {
  _id: string;
  badgeName: string;
  badgeImage: string;
  criteria: string;
  description: string;
}

/**
 * Available options for badge criteria categories
 */
const criteriaOptions = [
  "Achievement Milestone Badges",
  "Specific Badges",
  "Engagement and Activity Badges",
  "Exclusive Recognition Badges",
];

/**
 * Constructs a full URL for badge images with cache-busting
 * @param url - The relative or partial URL of the badge image
 * @returns The full URL with proper cache-busting parameters
 */
const getFullImageUrl = (url: string) => {
  if (!url) return "/placeholder-badge.png";

  const cacheParam = `&t=${Date.now()}`;

  if (url.startsWith("badges/")) {
    return `/api/file/retrieve?file=${encodeURIComponent(url)}${cacheParam}`;
  }

  if (url.includes("badges/")) {
    const badgesPath = url.substring(url.indexOf("badges/"));
    return `/api/file/retrieve?file=${encodeURIComponent(badgesPath)}${cacheParam}`;
  }

  if (url.includes("/api/file/retrieve")) {
    return url.includes("?")
      ? `${url}&t=${Date.now()}`
      : `${url}?t=${Date.now()}`;
  }

  if (url.startsWith("http")) return url;

  return `/api/file/retrieve?file=${encodeURIComponent(url)}${cacheParam}`;
};

/**
 * Uploads a badge image to the server
 * @param file - The image file to upload
 * @param namePrefix - Prefix to use for the image filename
 * @returns Promise resolving to the uploaded file URL
 */
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

/**
 * Validates badge input data
 * @param name - Badge name
 * @param description - Badge description
 * @param image - Badge image file (optional in edit mode)
 * @param isEdit - Whether this is an edit operation
 * @returns Validation result with status and error message
 */
const validateBadgeInput = (
  name: string,
  description: string,
  image: File | null,
  isEdit: boolean
): { isValid: boolean; errorMessage: string } => {
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
  if (!description || description.trim().length === 0) {
    return { isValid: false, errorMessage: "Description is required" };
  }

  if (description.trim().length < 10) {
    return {
      isValid: false,
      errorMessage: "Description must be at least 10 characters long",
    };
  }
  if (!isEdit && !image) {
    return { isValid: false, errorMessage: "Badge image is required" };
  }
  if (image) {
    const imageValidation = validateImageFile(image);
    if (!imageValidation.isValid) {
      return imageValidation;
    }
  }

  return { isValid: true, errorMessage: "" };
};

/**
 * Validates an image file for type and size constraints
 * @param file - The image file to validate
 * @returns Validation result with status and error message
 */
const validateImageFile = (
  file: File
): { isValid: boolean; errorMessage: string } => {
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
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      errorMessage: "Image size should be less than 2MB",
    };
  }

  return { isValid: true, errorMessage: "" };
};

/**
 * BadgeManager component for admin dashboard
 * Handles creating, reading, updating, and deleting badges
 */
export default function BadgeManager() {
  // State for badge list and loading status
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for the badge creation form
  const [badgeName, setBadgeName] = useState("");
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(
    null
  );
  const [criteria, setCriteria] = useState(criteriaOptions[0]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for the badge editing form
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

  // State for error handling and image loading
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [imageRetryCount, setImageRetryCount] = useState<
    Record<string, number>
  >({});
  const MAX_RETRY_ATTEMPTS = 2;

  /**
   * Manually retry loading an image that failed to load
   * @param badgeId - ID of the badge with failed image
   * @param imageUrl - URL of the image to retry loading
   */
  const handleImageRetry = (badgeId: string, imageUrl: string) => {
    console.log(`Manually retrying image for badge ID: ${badgeId}`);

    setImageErrors((prev) => ({
      ...prev,
      [badgeId]: false,
    }));

    setImageRetryCount((prev) => ({
      ...prev,
      [badgeId]: 0,
    }));

    setBadges((prev) =>
      prev.map((badge) => {
        if (badge._id === badgeId) {
          const updatedBadge = {
            ...badge,
            _forceRefresh: Date.now(), // Add timestamp to force re-render
          };
          return updatedBadge;
        }
        return badge;
      })
    );
  };

  /**
   * Fetch all badges from the API when component mounts
   * or when refresh is triggered
   */
  useEffect(() => {
    async function fetchBadges() {
      setLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.BADGE.BASE);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched badges:", data);

          data.forEach((badge: Badge) => {
            console.log(
              `Badge ${badge.badgeName} image URL:`,
              badge.badgeImage
            );
          });

          setBadges(data);
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

  /**
   * Debug logger for badge image URLs
   */
  useEffect(() => {
    if (badges.length > 0) {
      console.log("Current badge image URLs:");
      badges.forEach((badge) => {
        console.log(`${badge.badgeName}: ${badge.badgeImage}`);
      });
    }
  }, [badges]);

  /**
   * Handle file selection for new badge image
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validation = validateImageFile(file);

      if (!validation.isValid) {
        setFormError(validation.errorMessage);
        e.target.value = ""; // Clear the input
        return;
      }

      setBadgeImage(file);
      setBadgeImagePreview(URL.createObjectURL(file));
      setFormError("");
    }
  };

  /**
   * Handle file selection for editing an existing badge image
   */
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validation = validateImageFile(file);

      if (!validation.isValid) {
        setEditFormError(validation.errorMessage);
        e.target.value = ""; // Clear the input
        return;
      }

      setEditFormState({
        ...editFormState,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
      setEditFormError("");
    }
  };

  /**
   * Submit handler for creating a new badge
   */
  const handleSubmit = async () => {
    setFormError("");

    // Validate form inputs
    const validation = validateBadgeInput(
      badgeName,
      description,
      badgeImage,
      false
    );

    if (!validation.isValid) {
      setFormError(validation.errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      const namePrefix = `badge_${badgeName.replace(/\s+/g, "_").toLowerCase()}`;

      if (!badgeImage) {
        throw new Error("Badge image is required");
      }

      // Upload image first
      const uploadedImageUrl = await uploadBadgeImage(badgeImage, namePrefix);

      // Then create badge with the uploaded image URL
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

      // Reset form after successful submission
      setBadgeName("");
      setBadgeImage(null);
      setBadgeImagePreview(null);
      setDescription("");
      setCriteria(criteriaOptions[0]);
      setFormError("");

      // Clear file input
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh the badge list
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

  /**
   * Start edit mode for a badge
   * @param badge - The badge to be edited
   */
  const startEditMode = (badge: Badge) => {
    setEditFormState({
      badgeId: badge._id,
      name: badge.badgeName,
      criteria: badge.criteria,
      description: badge.description,
      image: null,
      imagePreview: badge.badgeImage,
    });
    setEditFormError("");
  };

  /**
   * Cancel edit mode and reset the edit form
   */
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

  /**
   * Update an existing badge with edited information
   * @param badgeId - ID of the badge being updated
   */
  const handleUpdate = async (badgeId: string) => {
    setEditFormError("");

    // Validate form inputs
    const validation = validateBadgeInput(
      editFormState.name,
      editFormState.description,
      editFormState.image,
      true // This is an edit operation
    );

    if (!validation.isValid) {
      setEditFormError(validation.errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      let badgeImageUrl = null;

      // Upload new image if provided
      if (editFormState.image) {
        badgeImageUrl = await uploadBadgeImage(
          editFormState.image,
          "badge_update"
        );
      }

      // Build update data object
      const updateData: any = {
        badgeId,
        badgeName: editFormState.name,
        criteria: editFormState.criteria,
        description: editFormState.description,
      };

      // Only include image if a new one was uploaded
      if (badgeImageUrl) {
        updateData.badgeImage = badgeImageUrl;
      }

      console.log("Sending update data:", updateData);

      // Send update request to API
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

      // Update the badge in local state
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

      cancelEditMode();

      // Refresh badges to ensure consistency
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

  /**
   * Delete a badge after confirmation
   * @param badgeId - ID of the badge to delete
   */
  const handleDelete = async (badgeId: string) => {
    if (!confirm("Are you sure you want to delete this badge?")) return;

    setIsLoading(true);

    try {
      const deleteRes = await fetch(API_ENDPOINTS.BADGE.DELETE(badgeId), {
        method: "DELETE",
      });

      if (!deleteRes.ok) {
        throw new Error("Failed to delete badge");
      }

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

  /**
   * Manually refresh the badge list
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(API_ENDPOINTS.BADGE.BASE);
      if (response.ok) {
        const data = await response.json();
        console.log("Refreshed badges:", data);
        setBadges(data);

        setImageErrors({});
        setImageRetryCount({});
      } else {
        console.error("Failed to refresh badges:", await response.text());
      }
    } catch (error) {
      console.error("Error refreshing badges:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Debug component for badge data
   * @returns JSX for debugging badge data
   */
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

  return (
    <div className="space-y-10">
      {/* New Badge Creation Form */}
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold mb-4">Add New Badge</h2>

        {formError && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          {/* Badge Name Input */}
          <input
            type="text"
            placeholder="Badge Name"
            value={badgeName}
            onChange={(e) => {
              setBadgeName(e.target.value);
              if (formError) setFormError("");
            }}
            className="w-full border p-2 rounded"
            maxLength={50}
          />

          {/* Badge Criteria Dropdown */}
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

          {/* Badge Description Textarea */}
          <div>
            <textarea
              placeholder="Badge Description (minimum 10 characters)"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (formError) setFormError("");
              }}
              className="w-full border p-2 rounded resize-none"
              rows={3}
            />
            <div className="text-xs text-gray-500 mt-1">
              {description.length}/10 characters minimum
            </div>
          </div>

          {/* Badge Image Upload */}
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

          {/* Submit Button */}
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

      {/* Badge Management Section */}
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

        {loading ? (
          <div className="text-center py-8">Loading badges...</div>
        ) : badges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No badges available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Badge Cards */}
            {badges.map((badge) => (
              <div
                key={badge._id}
                className="border rounded-lg overflow-hidden"
              >
                <div className="flex items-start p-4">
                  {/* Badge Image */}
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
                          title="Try loading the image again"
                        >
                          Retry loading
                        </button>
                      </div>
                    ) : (
                      <>
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

                            setImageRetryCount((prev) => ({
                              ...prev,
                              [badgeId]: currentRetries + 1,
                            }));

                            // Implement progressive fallback strategy for image loading
                            if (currentRetries < MAX_RETRY_ATTEMPTS) {
                              let retryUrl;

                              if (currentRetries === 0) {
                                if (
                                  badge.badgeImage &&
                                  badge.badgeImage.includes("badges/")
                                ) {
                                  const badgePath = badge.badgeImage.substring(
                                    badge.badgeImage.indexOf("badges/")
                                  );
                                  retryUrl = `/api/file/retrieve?file=${encodeURIComponent(
                                    badgePath
                                  )}&t=${Date.now()}`;
                                } else {
                                  retryUrl = `/api/file/retrieve?file=${encodeURIComponent(
                                    badge.badgeImage
                                  )}&t=${Date.now()}`;
                                }
                              } else if (currentRetries === 1) {
                                retryUrl = `/api/file/retrieve?file=${encodeURIComponent(
                                  badge.badgeImage
                                )}&nocache=${Date.now()}`;
                              }

                              if (retryUrl) {
                                console.log(`Retrying with URL: ${retryUrl}`);
                                target.src = retryUrl;
                                return;
                              }
                            }

                            // Mark image as failed after multiple retry attempts
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

                  {/* Badge Details and Actions */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{badge.badgeName}</h3>

                    {editFormState.badgeId === badge._id ? (
                      <>
                        {/* Edit Form for Existing Badge */}
                        {editFormError && (
                          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4 mx-4 text-sm">
                            {editFormError}
                          </div>
                        )}
                        <div className="space-y-2 mt-2">
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

                          {/* Edit Form Action Buttons */}
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
                      <>
                        {/* Badge View Mode */}
                        <div className="text-sm text-blue-600 mb-1">
                          {badge.criteria}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {badge.description}
                        </p>

                        {/* Badge Action Buttons */}
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
