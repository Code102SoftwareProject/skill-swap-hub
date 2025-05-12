'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from '@/components/ui/Toast';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Notification as NotificationType } from '@/types/notification';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
  showNotification: (notification: NotificationType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const router = useRouter();

  // Regular toast functionality
  const showToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  // Socket notification functionality
  const showNotification = (notification: NotificationType) => {
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification._id !== id));
  };

  // Individual Notification Toast Component (moved from NotificationAlert)
  const NotificationToast = ({ notification, onClose }: { notification: NotificationType, onClose: () => void }) => {
    const handleClick = () => {
      if (notification.targetDestination) {
        router.push(notification.targetDestination);
      }
      onClose();
    };

    const notificationColor = notification.color || '#006699';

    return (
      <div 
        className="flex items-start p-4 mb-3 bg-white border-l-4 rounded-md shadow-md animate-slide-in"
        style={{ borderLeftColor: notificationColor }}
        onClick={handleClick}
        role="alert"
      >
        <div className="flex-shrink-0 mr-3">
          <Bell 
            className="h-5 w-5" 
            style={{ color: notificationColor }} 
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 mr-2">
          <p className="font-medium text-sm">{notification.typename || 'Notification'}</p>
          <p className="text-sm text-gray-600">{notification.description}</p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  };

  return (
    <ToastContext.Provider value={{ showToast, showNotification }}>
      {children}
      
      {/* Regular toasts container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}
      
      {/* Notifications container */}
      {notifications.length > 0 && (
        <div 
          className="fixed top-20 right-4 z-50 w-80"
          aria-live="polite"
        >
          {notifications.map((notification) => (
            <NotificationToast 
              key={notification._id} 
              notification={notification} 
              onClose={() => removeNotification(notification._id)} 
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};