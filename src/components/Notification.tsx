import React from "react";

interface NotificationProps {
  type: string;
  description: string;
  isRead: boolean;
  targetDestination: string | null;
}

const NotificationCard: React.FC<NotificationProps> = ({
  type,
  description,
  isRead,
  targetDestination,
}) => {
  // Determine the color of the icon based on the notification type
  const getIconColor = (type: string): string => {
    switch (type) {
      case "NEW_SKILL_MATCH_FOUND":
      case "NEW_MESSAGE_RECEIVED":
        return "bg-green-500";
      case "SESSION_REQUEST":
      case "SESSION_REQUEST_APPROVED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`border border-gray-300 rounded-lg p-4 flex items-center gap-4 ${
        isRead ? "bg-gray-100" : "bg-white"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${getIconColor(
          type
        )}`}
      >
        !
      </div>

      {/* Notification Content */}
      <div className="flex-1">
        <p className="m-0 font-bold">{type.replace(/_/g, " ")}</p>
        <p className="mt-1 text-gray-600">{description}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {targetDestination && (
          <a
            href={targetDestination}
            className="text-blue-500 border border-blue-500 rounded px-2 py-1 text-sm hover:bg-blue-500 hover:text-white transition"
          >
            View
          </a>
        )}
        <button
          className="bg-transparent text-red-500 border border-red-500 rounded px-2 py-1 text-sm cursor-pointer hover:bg-red-500 hover:text-white transition"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default NotificationCard;