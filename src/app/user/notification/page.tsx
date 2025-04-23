'use client';

import React, { useState, useEffect } from 'react';
import Notification from '@/components/notificationSystem/Notification';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar'; // Import the Navbar component

// Define notification type
interface NotificationType {
  _id: string;
  type: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  targetDestination: string | null;
}

const NotificationPage = () => {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user notifications when component mounts
  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !token) {
      router.push('/login?redirect=/user/notification');
      return;
    }

    // Only fetch notifications if we have a token
    if (token) {
      fetchNotifications();
    }
  }, [token, authLoading, router]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the correct API endpoint (notification singular, not plural)
      const response = await fetch(`/api/notification?userId=${user?._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === id 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto max-w-4xl py-20 px-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#006699] mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* User greeting */}
        {user && (
          <div className="mb-4 text-gray-600">
            <p>Notifications for {user.firstName} {user.lastName}</p>
          </div>
        )}

        {/* Header with title and actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-[#006699] mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-3 bg-[#006699] text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <select 
              aria-label="Filter notifications"
              className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            >
              <option value="all">All notifications</option>
              <option value="unread">Unread only</option>
            </select>
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center text-[#006699] hover:text-[#004466] text-sm font-medium"
              disabled={unreadCount === 0}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Notifications list */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map(notification => (
                <Notification 
                  key={notification._id} 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 px-4 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-500 text-lg">No notifications to display</h3>
              {filter === 'unread' && notifications.length > 0 && (
                <p className="text-gray-400 text-sm mt-1">
                  Switch to "All notifications" to see your previous notifications
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPage;