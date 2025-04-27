'use client';

import { useState } from "react";
import Image from "next/image";

const criteriaOptions = [
  "Achievement Milestone Badges",
  "Specific Badges",
  "Engagement and Activity Badges",
  "Exclusive Recognition Badges",
];

export default function BadgeManager() {
  const [badgeName, setBadgeName] = useState("");
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(null);
  const [criteria, setCriteria] = useState(criteriaOptions[0]);
  const [description, setDescription] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBadgeImage(file);
      setBadgeImagePreview(URL.createObjectURL(file)); // Temporary preview
    }
  };

  const handleSubmit = async () => {
    if (!badgeName || !badgeImage || !description) {
      alert("Please fill all fields!");
      return;
    }

    const formData = new FormData();
    formData.append("badgeName", badgeName);
    formData.append("criteria", criteria);
    formData.append("description", description);
    formData.append("badgeImage", badgeImage); // Handle in API route!

    try {
      const res = await fetch("/api/badges/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Badge added successfully!");
        setBadgeName("");
        setBadgeImage(null);
        setBadgeImagePreview(null);
        setDescription("");
        setCriteria(criteriaOptions[0]);
      } else {
        alert("Failed to add badge!");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting badge!");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
      <h2 className="text-2xl font-bold mb-4">Add New Badge</h2>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Badge Name"
          value={badgeName}
          onChange={(e) => setBadgeName(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <select
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          className="w-full border p-2 rounded"
        >
          {criteriaOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <textarea
          placeholder="Badge Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded resize-none"
          rows={3}
        />

        <div className="space-y-2">
          <label className="block">Badge Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {badgeImagePreview && (
            <div className="mt-2">
              <Image src={badgeImagePreview} alt="Preview" width={100} height={100} className="rounded" />
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Add Badge
        </button>
      </div>
    </div>
  );
}
