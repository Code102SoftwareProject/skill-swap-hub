"use client";

import { useState } from "react";
import Image from "next/image";
import {
  criteriaOptions,
  validateBadgeInput,
  handleImageFileChange,
  uploadBadgeImage,
  API_ENDPOINTS,
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

    // Clear file input
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  /**
   * Handles image file selection
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageFileChange(e, setBadgeImage, setBadgeImagePreview, setFormError);
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
  );
};

export default BadgeForm;
