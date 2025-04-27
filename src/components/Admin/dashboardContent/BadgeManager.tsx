'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { Pencil, Trash2, X, Check, RefreshCcw } from "lucide-react";

interface Badge {
  _id: string;
  badgeName: string;
  badgeImage: string;
  criteria: string;
  description: string;
}

const criteriaOptions = [
  "Achievement Milestone Badges",
  "Specific Badges",
  "Engagement and Activity Badges",
  "Exclusive Recognition Badges",
];

export default function BadgeManager() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [badgeName, setBadgeName] = useState("");
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(null);
  const [criteria, setCriteria] = useState(criteriaOptions[0]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Edit states
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editCriteria, setEditCriteria] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  
  // Fetch badges
  useEffect(() => {
    async function fetchBadges() {
      setLoading(true);
      try {
        const response = await fetch("/api/badge");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched badges with images:", data.map((b: Badge) => ({ 
            id: b._id, 
            name: b.badgeName, 
            imageUrl: b.badgeImage 
          })));
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

  // Handle file change for new badge
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBadgeImage(file);
      setBadgeImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle file change for edit mode
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle creating a new badge
  const handleSubmit = async () => {
    if (!badgeName || !badgeImage || !description) {
      alert("Please fill all fields!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Step 1: Upload the image to R2
      const fileExt = badgeImage.name.split('.').pop();
      const safeFileName = `badges/badge_${badgeName.replace(/\s+/g, '_').toLowerCase()}.${fileExt}`;
      
      const uploadFormData = new FormData();
      const renamedFile = new File([badgeImage], safeFileName, { type: badgeImage.type });
      uploadFormData.append("file", renamedFile);

      const uploadRes = await fetch("/api/file/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image");
      }

      const uploadData = await uploadRes.json();
      
      // Step 2: Create badge with the image URL
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

      // Reset form
      setBadgeName("");
      setBadgeImage(null);
      setBadgeImagePreview(null);
      setDescription("");
      setCriteria(criteriaOptions[0]);
      
      // Refresh badge list
      setRefreshTrigger(prev => prev + 1);
      alert("Badge added successfully!");
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter edit mode for a badge
  const startEditMode = (badge: Badge) => {
    setEditMode(badge._id);
    setEditCriteria(badge.criteria);
    setEditDescription(badge.description);
    setEditImagePreview(badge.badgeImage);
    setEditImage(null);
  };

  // Cancel edit mode
  const cancelEditMode = () => {
    setEditMode(null);
    setEditImage(null);
    setEditImagePreview(null);
  };

  // Handle updating a badge
  const handleUpdate = async (badgeId: string) => {
    setIsLoading(true);
    
    try {
      let updatedImageUrl = null;
      
      // Upload new image if changed
      if (editImage) {
        const fileExt = editImage.name.split('.').pop();
        const badge = badges.find(b => b._id === badgeId);
        if (!badge) throw new Error("Badge not found");
        
        const safeFileName = `badges/badge_${badge.badgeName.replace(/\s+/g, '_').toLowerCase()}_updated.${fileExt}`;
        
        const uploadFormData = new FormData();
        const renamedFile = new File([editImage], safeFileName, { type: editImage.type });
        uploadFormData.append("file", renamedFile);

        const uploadRes = await fetch("/api/file/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadRes.json();
        updatedImageUrl = uploadData.url;
      }
      
      // Update badge data
      const updateData: any = {
        badgeId,
        criteria: editCriteria,
        description: editDescription
      };
      
      if (updatedImageUrl) {
        updateData.badgeImage = updatedImageUrl;
      }

      const updateRes = await fetch("/api/badge", {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to update badge");
      }

      // Reset and refresh
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

  // Handle deleting a badge
  const handleDelete = async (badgeId: string) => {
    if (!confirm("Are you sure you want to delete this badge?")) return;
    
    setIsLoading(true);
    
    try {
      const deleteRes = await fetch(`/api/badge?badgeId=${badgeId}`, {
        method: "DELETE",
      });

      if (!deleteRes.ok) {
        throw new Error("Failed to delete badge");
      }

      setRefreshTrigger(prev => prev + 1);
      alert("Badge deleted successfully!");
    } catch (error) {
      console.error(error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Add New Badge Section */}
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
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600'} text-white p-2 rounded hover:bg-blue-700 flex justify-center`}
          >
            {isLoading ? 'Adding Badge...' : 'Add Badge'}
          </button>
        </div>
      </div>

      {/* Manage Existing Badges Section */}
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

        {loading ? (
          <div className="text-center py-8">Loading badges...</div>
        ) : badges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No badges available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {badges.map(badge => (
              <div key={badge._id} className="border rounded-lg overflow-hidden">
                <div className="flex items-start p-4">
                  <div className="w-16 h-16 relative mr-4 flex-shrink-0">
                    {/* Image component */}
                    <img 
                      src={editMode === badge._id && editImagePreview ? editImagePreview : badge.badgeImage}
                      alt={badge.badgeName}
                      className="rounded object-cover w-full h-full"
                      onError={(e) => {
                        console.error(`Failed to load image for badge ${badge.badgeName}:`, 
                          (e.target as HTMLImageElement).src);
                        (e.target as HTMLImageElement).src = "/placeholder-badge.png";
                      }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{badge.badgeName}</h3>
                    
                    {editMode === badge._id ? (
                      <>
                        <div className="space-y-2 mt-2">
                          <select
                            value={editCriteria}
                            onChange={(e) => setEditCriteria(e.target.value)}
                            className="w-full border p-2 rounded text-sm"
                          >
                            {criteriaOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full border p-2 rounded text-sm resize-none"
                            rows={3}
                          />
                          
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleEditImageChange}
                            className="text-sm"
                          />
                          
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
                        <div className="text-sm text-blue-600 mb-1">{badge.criteria}</div>
                        <p className="text-gray-600 text-sm">{badge.description}</p>
                        
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
