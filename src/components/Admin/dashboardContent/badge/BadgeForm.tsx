"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  criteriaOptions,
  validateBadgeInput,
  handleImageFileChange,
  uploadBadgeImage,
  API_ENDPOINTS,
  validateImageFile,
} from "./badgeHelpers";

interface BadgeFormProps {
  onBadgeAdded: () => void;
}

const BadgeForm = ({ onBadgeAdded }: BadgeFormProps) => {
  // Form state
  const [badgeName, setBadgeName] = useState("");
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(
    null
  );
  const [criteria, setCriteria] = useState(criteriaOptions[0]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Drag and drop states
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Resets form fields to initial state
   */
  const resetForm = () => {
    setBadgeName("");
    setBadgeImage(null);
    setBadgeImagePreview(null);
    setDescription("");
    setCriteria(criteriaOptions[0]);
    setFormError("");
    setIsDragActive(false);
    setIsDragOver(false);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Handles image file selection for both drag/drop and file input
   */
  const handleImageFileSelection = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setFormError(validation.errorMessage);
      return;
    }

    setBadgeImage(file);
    setBadgeImagePreview(URL.createObjectURL(file));
    setFormError("");
  }, []);

  /**
   * Handles image file selection from file input
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFileSelection(e.target.files[0]);
    }
  };

  /**
   * Handles drag enter event
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
    setIsDragOver(true);
  }, []);

  /**
   * Handles drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    // Only set drag inactive if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  }, []);

  /**
   * Handles drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  /**
   * Handles file drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        handleImageFileSelection(file);
      }
    },
    [handleImageFileSelection]
  );

  /**
   * Handles click on drop zone to open file picker
   */
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async () => {
    setFormError("");

    // Validate form inputs
    const validation = validateBadgeInput(
      badgeName,
      description,
      badgeImage,
      false // not an edit operation
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
      resetForm();

      // Notify parent component about the new badge
      onBadgeAdded();

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4 text-gray-900 dark:text-gray-900">
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

        {/* Badge Criteria Selection */}
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

        {/* Badge Description Input */}
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

        {/* Enhanced Badge Image Upload with Drag & Drop */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Badge Image
          </label>

          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleDropZoneClick}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
              ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : badgeImage
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-gray-400 bg-gray-50"
              }
              ${isDragActive ? "scale-105" : ""}
            `}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg, image/png, image/gif, image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            {badgeImagePreview ? (
              /* Image Preview */
              <div className="space-y-3">
                <Image
                  src={badgeImagePreview}
                  alt="Badge Preview"
                  width={120}
                  height={120}
                  className="mx-auto rounded-lg shadow-md"
                />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{badgeImage?.name}</p>
                  <p className="text-xs">
                    {badgeImage && (badgeImage.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Click to change or drag a new image here
                </p>
              </div>
            ) : (
              /* Upload Prompt */
              <div className="space-y-3">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-10 h-10 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {isDragOver ? "Drop your image here" : "Upload Badge Image"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag and drop an image here, or click to select
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports JPEG, PNG, GIF, WEBP up to 2MB
                  </p>
                </div>
              </div>
            )}

            {/* Visual feedback overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                <div className="text-blue-600 font-medium">Drop image here</div>
              </div>
            )}
          </div>

          {/* Alternative text upload option */}
          <div className="text-center">
            <span className="text-xs text-gray-500">
              or{" "}
              <button
                type="button"
                onClick={handleDropZoneClick}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                browse files
              </button>
            </span>
          </div>
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
  );
};

export default BadgeForm;
