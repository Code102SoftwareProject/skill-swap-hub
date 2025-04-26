import React from 'react';
import { IoMdInformationCircle, IoMdCheckmarkCircle, IoMdAlert } from 'react-icons/io';
import { format } from 'date-fns';
import { NotificationProps} from '@/types/notification'

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

  const handleClick = () => {
    onMarkAsRead(notification._id);
    
    // If there's a target destination, navigate to it
    if (notification.targetDestination) {
      window.location.href = notification.targetDestination;
    }
  };

  return (
    <div 
      className={`p-4 mb-2 border-l-4 flex items-start rounded-md shadow-sm ${
        notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-400'
      } cursor-pointer transition-colors duration-200`}
      onClick={handleClick}
    >
      <div className="mr-3 mt-0.5">
        {icon}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{notification.description}</p>
        <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
      </div>
      
      {!notification.isRead && (
        <div className="ml-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
        </div>
      )}
    </div>
  );
};

export default Notification;