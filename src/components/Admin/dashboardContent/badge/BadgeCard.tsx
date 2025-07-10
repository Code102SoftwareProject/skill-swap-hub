"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "./badgeHelpers";
import BadgeImage from "./BadgeImage";
import BadgeEditForm from "./BadgeEditForm";

interface BadgeCardProps {
  badge: Badge;
  onUpdate: (updatedBadge: Badge) => void;
  onDelete: (badgeId: string) => void;
}

const BadgeCard = ({ badge, onUpdate, onDelete }: BadgeCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Start badge editing mode
   */
  const startEditMode = () => {
    setIsEditing(true);
  };

  /**
   * Cancel badge editing mode
   */
  const cancelEditMode = () => {
    setIsEditing(false);
  };

  /**
   * Handle badge update from edit form
   */
  const handleUpdate = (updatedBadge: Badge) => {
    onUpdate(updatedBadge);
    setIsEditing(false);
  };

  /**
   * Handle badge deletion with confirmation
   */
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this badge?")) {
      onDelete(badge._id);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-start p-4">
        {/* Badge Image */}
        <div className="w-16 h-16 relative mr-4 flex-shrink-0">
          <BadgeImage
            badgeId={badge._id}
            badgeName={badge.badgeName}
            imageUrl={badge.badgeImage}
            editMode={isEditing}
          />
        </div>

        {/* Badge Details and Actions */}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{badge.badgeName}</h3>

          {isEditing ? (
            <BadgeEditForm
              badge={badge}
              onCancel={cancelEditMode}
              onUpdate={handleUpdate}
            />
          ) : (
            <>
              {/* Badge View Mode */}
              <div className="text-sm text-blue-600 mb-1">{badge.criteria}</div>
              <p className="text-gray-600 text-sm">{badge.description}</p>

              {/* Badge Action Buttons */}
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={startEditMode}
                  className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  <Pencil size={14} className="mr-1" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
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
  );
};

export default BadgeCard;
