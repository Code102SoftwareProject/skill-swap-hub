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
      className={`p-4 mb-2 border-l-4 flex items-start rounded-md shadow-sm ${
        notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-l-4'
      } transition-colors duration-200`}
      style={{ borderLeftColor: notification.isRead ? '#e5e7eb' : typeColor }}
    >
      <div className="mr-3 mt-0.5">
        <Info className="text-xl" style={{ color: typeColor }} />
      </div>

      <div className="flex-1">
        <div className="flex items-center">
          <span 
            className="text-xs font-medium px-2 py-0.5 rounded-full mr-2 font-heading"
            style={{ 
              backgroundColor: `${typeColor}20`, // 20% opacity version
              color: typeColor 
            }}
          >
            {typeName}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-900 mt-1 font-body">{notification.description}</p>
        <p className="text-xs text-gray-500 mt-1 font-body">{formattedDate}</p>
      </div>

      <div className="ml-3 flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        {!notification.isRead && (
          <button
            onClick={handleMarkReadClick}
            className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md transition-colors font-body"
            aria-label="Mark as read"
          >
            <Check className="w-3 h-3 mr-1" />
            Mark Read
          </button>
        )}
        {notification.targetDestination && (
          <button
            onClick={handleViewClick}
            className="flex  font-body items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
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