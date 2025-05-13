'use client';

import React, { useEffect } from 'react';
import { useSocket } from '@/lib/context/SocketContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Notification as NotificationType } from '@/types/notification';
import { useToast } from '@/lib/context/ToastContext';

/**
 * NotificationAlert component that listens for real-time notifications
 * and displays them as toast messages
 */
export default function NotificationAlert() {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { showNotification } = useToast();
  const router = useRouter();

  // Socket event listener for new notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    /**
     * Handles incoming notifications from the socket
     * @param notificationData - Raw notification data from the server
     */
    const handleNewNotification = (notificationData: any) => {
      console.log('Alert received notification:', notificationData);
      
      // Only process notifications which the required data
      if (!notificationData.description) return;
      
      //  notification object
      const newNotification: NotificationType = {
        _id: notificationData._id || `temp-${Date.now()}`,
        typename: notificationData.type || 'Notification',
        description: notificationData.description,
        color: notificationData.color || '#006699',
        createdAt: notificationData.createdAt || new Date().toISOString(),
        isRead: false,
        targetDestination: notificationData.targetDestination || null
      };

      // Use the unified toast system to display the notification
      showNotification(newNotification);
    };

    // Register socket event listener
    socket.on('receive_notification', handleNewNotification);

    // Clean up event listener on unmount
    return () => {
      socket.off('receive_notification', handleNewNotification);
    };
  }, [socket, isConnected, user, showNotification]);

  // Component doesn't render  just handles socket events
  return null;
}