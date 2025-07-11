"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import {
  Badge,
  criteriaOptions,
  validateBadgeInput,
  uploadBadgeImage,
  handleImageFileChange,
  API_ENDPOINTS,
} from "./badgeHelpers";

interface BadgeEditFormProps {
  badge: Badge;
  onCancel: () => void;
  onUpdate: (updatedBadge: Badge) => void;
}

const BadgeEditForm = ({ badge, onCancel, onUpdate }: BadgeEditFormProps) => {
  // Edit form state
  const [name, setName] = useState(badge.badgeName);
  const [criteria, setCriteria] = useState(badge.criteria);
  const [description, setDescription] = useState(badge.description);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    badge.badgeImage
  );
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Reset form when badge changes
  useEffect(() => {
    setName(badge.badgeName);
    setCriteria(badge.criteria);
    setDescription(badge.description);
    setImage(null);
    setImagePreview(badge.badgeImage);
  }, [badge]);

  /**
   * Handles image file selection
   */
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageFileChange(e, setImage, setImagePreview, setFormError);
  };

  /**
   * Handles form submission
   */
  const handleUpdate = async () => {
    setFormError("");

    // Validate form inputs
    const validation = validateBadgeInput(name, description, image, true);

    if (!validation.isValid) {
      setFormError(validation.errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      let badgeImageUrl = null;

      // Upload new image if provided
      if (image) {
        badgeImageUrl = await uploadBadgeImage(image, "badge_update");
      }

      // Build update data object
      const updateData: any = {
        badgeId: badge._id,
        badgeName: name,
        criteria,
        description,
      };
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

      // Notify parent component
      onUpdate({
        ...badge,
        badgeName: name,
        criteria,
        description,
        ...(badgeImageUrl ? { badgeImage: badgeImageUrl } : {}),
      });

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

  return (
    <div className="space-y-2 mt-2">
      {formError && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4 mx-4 text-sm">
          {formError}
        </div>
      )}

      {/* Badge Name Input */}
      <input
        type="text"
        placeholder="Badge Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (formError) setFormError("");
        }}
        className="w-full border p-2 rounded text-sm"
        maxLength={50}
      />

      {/* Badge Criteria Selection */}
      <select
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
        className="w-full border p-2 rounded text-sm"
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
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (formError) setFormError("");
          }}
          className="w-full border p-2 rounded text-sm resize-none"
          rows={3}
          placeholder="Badge Description (minimum 10 characters)"
        />
        <div className="text-xs text-gray-500 mt-1">
          {description.length}/10 characters minimum
        </div>
      </div>

      {/* Badge Image Upload */}
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
          onClick={handleUpdate}
          disabled={isLoading}
          className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          <Check size={16} className="mr-1" />
          Save
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        >
          <X size={16} className="mr-1" />
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BadgeEditForm;
