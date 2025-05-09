'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/lib/context/SocketContext';
import { useAuth } from '@/lib/context/AuthContext';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Notification as NotificationType } from '@/types/notification';

interface ToastProps {
  notification: NotificationType;
  onClose: () => void;
}

const Toast = ({ notification, onClose }: ToastProps) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (notification.targetDestination) {
      router.push(notification.targetDestination);
    }
    onClose();
  };

  return (
    <div 
      className={`flex items-start p-4 mb-3 bg-white border-l-4 rounded-md shadow-md animate-slide-in`}
      style={{ borderLeftColor: notification.color || '#006699' }}
    >
      <div className="flex-shrink-0 mr-3">
        <Bell className="h-5 w-5" style={{ color: notification.color || '#006699' }} />
      </div>
      <div className="flex-1 mr-2">
        <p className="font-medium text-sm">{notification.typename || 'Notification'}</p>
        <p className="text-sm text-gray-600">{notification.description}</p>
      </div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default function NotificationAlert() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [toasts, setToasts] = useState<NotificationType[]>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notificationData: any) => {
      console.log('Alert received notification:', notificationData);
      
      // Only process notifications that have the required data
      if (notificationData.description) {
        // Add to toast list
        const newNotification: NotificationType = {
          _id: notificationData._id || `temp-${Date.now()}`,
          typename: notificationData.type || 'Notification',
          description: notificationData.description,
          color: notificationData.color || '#006699',
          createdAt: notificationData.createdAt || new Date().toISOString(),
          isRead: false,
          targetDestination: notificationData.targetDestination || null
        };

        setToasts(prev => [...prev, newNotification]);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t._id !== newNotification._id));
        }, 5000);
      }
    };

    socket.on('receive_notification', handleNewNotification);

    return () => {
      socket.off('receive_notification', handleNewNotification);
    };
  }, [socket, isConnected, user]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast._id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 w-80">
      {toasts.map((toast) => (
        <Toast 
          key={toast._id} 
          notification={toast} 
          onClose={() => removeToast(toast._id)} 
        />
      ))}
    </div>
  );
}