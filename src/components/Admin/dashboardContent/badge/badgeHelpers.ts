// Badge utility functions and types
import { ChangeEvent } from "react";

// API endpoints configuration for badge and file operations
export const API_ENDPOINTS = {
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

// Type definition for Badge data structure
export interface Badge {
  _id: string;
  badgeName: string;
  badgeImage: string;
  criteria: string;
  description: string;
}

// Predefined categories for badge criteria
export const criteriaOptions = [
  "Achievement Milestone Badges",
  "Specific Badges",
  "Engagement and Activity Badges",
  "Exclusive Recognition Badges",
];

/**
 * Constructs a complete image URL with cache-busting
 * @param url - The relative or absolute image path
 * @returns Full URL to the image with appropriate path handling
 */
export const getFullImageUrl = (url: string) => {
  if (!url || url.trim() === "") return "/placeholder-badge.png";

  const timestamp = Date.now();

  if (url.includes("/api/file/retrieve")) {
    return url.includes("?")
      ? `${url}&t=${timestamp}`
      : `${url}?t=${timestamp}`;
  }

  if (url.startsWith("badges/")) {
    return `/api/file/retrieve?file=${encodeURIComponent(url)}&t=${timestamp}`;
  }

  if (url.includes("badges/")) {
    const badgesPath = url.substring(url.indexOf("badges/"));
    return `/api/file/retrieve?file=${encodeURIComponent(badgesPath)}&t=${timestamp}`;
  }

  if (url.startsWith("http")) return url;

  return `/api/file/retrieve?file=${encodeURIComponent(url)}&t=${timestamp}`;
};

/**
 * Uploads a badge image to the server
 * @param file - The image file to upload
 * @param namePrefix - Prefix for the file name
 * @returns URL of the uploaded image
 */
export const uploadBadgeImage = async (
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
 * Validates badge form input data
 * @param name - Badge name
 * @param description - Badge description
 * @param image - Badge image file
 * @param isEdit - Whether this is an edit operation
 * @returns Validation result with error message if invalid
 */
export const validateBadgeInput = (
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
 * Validates image file type and size
 * @param file - The image file to validate
 * @returns Validation result with error message if invalid
 */
export const validateImageFile = (
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
 * Handler for image file input change
 * @param e - File input change event
 * @param setImage - Function to set the selected image file
 * @param setImagePreview - Function to set the image preview URL
 * @param setError - Function to set error message
 * @returns void
 */
export const handleImageFileChange = (
  e: ChangeEvent<HTMLInputElement>,
  setImage: (file: File | null) => void,
  setImagePreview: (url: string | null) => void,
  setError: (message: string) => void
): void => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.errorMessage);
      e.target.value = ""; // Clear the input
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }
};
