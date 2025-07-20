import React from 'react';
import { format } from 'date-fns';
import { NotificationProps} from '@/types/notification';
import { Check, Eye, Info } from 'lucide-react'; 

const Notification: React.FC<NotificationProps> = ({ notification, onMarkAsRead }) => {
  // Get the values from the direct properties 
  const typeName = notification.typename || 'Notification';
  const typeColor = notification.color || '#3B82F6';
  
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
      className={`p-3 sm:p-4 mb-2 border-l-4 flex items-start rounded-md shadow-sm ${
        notification.isRead 
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600' 
          : 'bg-white dark:bg-gray-800 border-l-4'
      } transition-colors duration-200`}
      style={{ borderLeftColor: notification.isRead ? '#e5e7eb' : typeColor }}
    >
      <div className="mr-3 mt-0.5 flex-shrink-0">
        <Info className="text-xl" style={{ color: typeColor }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <span 
            className="text-xs font-medium px-2 py-0.5 rounded-full font-heading inline-block max-w-full sm:max-w-xs truncate"
            style={{ 
              backgroundColor: `${typeColor}20`, // 20% opacity version
              color: typeColor 
            }}
            title={typeName}
          >
            {typeName}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-body break-words">{notification.description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-body">{formattedDate}</p>
      </div>

      <div className="ml-3 flex flex-col xs:flex-row items-end xs:items-center space-y-2 xs:space-y-0 xs:space-x-2 flex-shrink-0">
        {!notification.isRead && (
          <button
            onClick={handleMarkReadClick}
            className="flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors font-body whitespace-nowrap"
            aria-label="Mark as read"
          >
            <Check className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="hidden xs:inline">Mark Read</span>
            <span className="xs:hidden">Read</span>
          </button>
        )}
        {notification.targetDestination && (
          <button
            onClick={handleViewClick}
            className="flex font-body items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors whitespace-nowrap"
            aria-label="View details"
          >
            <Eye className="w-3 h-3 mr-1 flex-shrink-0" />
            View
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;