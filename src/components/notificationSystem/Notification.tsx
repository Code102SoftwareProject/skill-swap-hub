import React from 'react';
import { IoMdInformationCircle, IoMdCheckmarkCircle, IoMdAlert } from 'react-icons/io';
import { format } from 'date-fns';
import { NotificationProps} from '@/types/notification';
import { Check, Eye } from 'lucide-react'; // Import icons for buttons

const Notification: React.FC<NotificationProps> = ({ notification, onMarkAsRead }) => {
  // Determine icon color based on notification type
  const getIconColorAndComponent = (type: string) => {
    // Types with gray icons (informational)
    if (
      type === "NEW_SKILL_MATCH_FOUND" ||
      type === "NEW_MESSAGE_RECEIVED" ||
      type === "SESSION_REQUEST" ||
      type === "MEETING_REQUEST"
    ) {
      return {
        color: 'text-gray-500',
        icon: <IoMdInformationCircle className="text-gray-500 text-xl" />
      };
    }

    // Types with green icons (success/approval)
    if (
      type === "SESSION_REQUEST_APPROVED" ||
      type === "MEETING_APPROVED_AND_SCHEDULED" ||
      type === "FEEDBACK_RECEIVED" ||
      type === "NEW_ACCOMPLISHMENT_BADGE_RECEIVED"
    ) {
      return {
        color: 'text-green-500',
        icon: <IoMdCheckmarkCircle className="text-green-500 text-xl" />
      };
    }

    // Types with red icons (alerts/warnings)
    if (type === "SYSTEM_MAINTENANCE_ALERT") {
      return {
        color: 'text-red-500',
        icon: <IoMdAlert className="text-red-500 text-xl" />
      };
    }

    // Default fallback
    return {
      color: 'text-gray-500',
      icon: <IoMdInformationCircle className="text-gray-500 text-xl" />
    };
  };

  const { icon } = getIconColorAndComponent(notification.type);
  const formattedDate = format(new Date(notification.createdAt), 'MMM dd, h:mm a');

  const handleMarkReadClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click events if nested
    onMarkAsRead(notification._id);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click events
    if (notification.targetDestination) {
      window.location.href = notification.targetDestination;
    }
  };

  return (
    <div
      className={`p-4 mb-2 border-l-4 flex items-start rounded-md shadow-sm ${
        notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-400'
      } transition-colors duration-200`}
    >
      <div className="mr-3 mt-0.5">
        {icon}
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{notification.description}</p>
        <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
      </div>

      <div className="ml-3 flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        {!notification.isRead && (
          <button
            onClick={handleMarkReadClick}
            className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md transition-colors"
            aria-label="Mark as read"
          >
            <Check className="w-3 h-3 mr-1" />
            Mark Read
          </button>
        )}
        {notification.targetDestination && (
          <button
            onClick={handleViewClick}
            className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
            aria-label="View details"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;