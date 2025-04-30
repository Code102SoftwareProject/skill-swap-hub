'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Import useMemo
import Notification from '@/components/notificationSystem/Notification';
import { Bell, CheckCheck, Loader2, Inbox, History, ArrowDownUp } from 'lucide-react'; // Added Inbox, History, ArrowDownUp icons
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest'); // State for sorting

  // Fetch user notifications when component mounts
  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !token) {
      router.push('/login?redirect=/user/notification');
      return;
    }

    // Only fetch notifications if we have a token
    if (token && user?._id) {
      fetchNotifications();
    } else if (!authLoading && !user?._id) {
      setError("Could not identify user. Please log in again.");
      setIsLoading(false);
    }
  }, [token, user?._id, authLoading, router]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);

    if (!user?._id) {
      setError("User ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/notification?userId=${user._id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Initial sort is handled by the backend or here if needed,
        // but useMemo will handle dynamic sorting based on user selection
        setNotifications(data.notifications);
      } else {
        throw new Error(data.message || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification._id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );

    try {
      const response = await fetch(`/api/notification/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId: id }) // Send notificationId in the request body
      });

      if (!response.ok) {
        // Revert optimistic update if the server request fails
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === id
              ? { ...notification, isRead: false }
              : notification
          )
        );
        console.error('Failed to mark notification as read on server');
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert optimistic update if there's an error
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === id
            ? { ...notification, isRead: false }
            : notification
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const previousNotifications = [...notifications];
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );

    try {
      const response = await fetch(`/api/notification/read-all?userId=${user?._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        setNotifications(previousNotifications);
        console.error('Failed to mark all notifications as read on server');
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setNotifications(previousNotifications);
    }
  };

  // Memoize sorted notifications based on sortOrder
  const sortedNotifications = useMemo(() => {
    const sorted = [...notifications]; // Create a copy to avoid mutating state
    if (sortOrder === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else { // 'oldest'
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return sorted;
  }, [notifications, sortOrder]);

  // Derive read/unread lists from the memoized sorted list
  const unreadNotifications = sortedNotifications.filter(n => !n.isRead);
  const readNotifications = sortedNotifications.filter(n => n.isRead);

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
        {user && (
          <div className="mb-4 text-gray-600">
            <p>Hi {user.firstName}, here are your notifications:</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          {/* Title and Unread Count */}
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-[#006699] mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
            {unreadNotifications.length > 0 && (
              <span className="ml-3 bg-[#006699] text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                {unreadNotifications.length} unread
              </span>
            )}
          </div>

          {/* Action Buttons: Sort and Mark All Read */}
          <div className="flex items-center gap-4">
             {/* Sort Dropdown */}
             {notifications.length > 0 && (
               <div className="relative inline-block text-left">
                 <select
                   value={sortOrder}
                   onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                   className="flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#006699] focus:border-[#006699] appearance-none pr-8 bg-white"
                   aria-label="Sort notifications"
                 >
                   <option value="newest">Newest First</option>
                   <option value="oldest">Oldest First</option>
                 </select>
                 <ArrowDownUp className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>
             )}

            {/* Mark All Read Button */}
            {unreadNotifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center text-[#006699] hover:text-[#004466] text-sm font-medium"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Unread Section */}
        {unreadNotifications.length > 0 && (
          <div className="mb-8">
            <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-3">
              <Inbox className="w-5 h-5 mr-2 text-blue-500" /> Unread
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
              {unreadNotifications.map(notification => (
                <Notification
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          </div>
        )}

        {/* Read Section */}
        {readNotifications.length > 0 && (
          <div className="mb-8">
            <h2 className="flex items-center text-lg font-semibold text-gray-700 mb-3">
              <History className="w-5 h-5 mr-2 text-gray-500" /> Read
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
              {readNotifications.map(notification => (
                <Notification
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead} // Keep this if you want to allow marking read items as read again (no effect) or potentially unread later
                />
              ))}
            </div>
          </div>
        )}

        {/* No Notifications */}
        {notifications.length === 0 && !isLoading && !error && (
          <div className="py-10 px-4 text-center bg-white rounded-lg shadow-sm border border-gray-200">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-500 text-lg">You have no notifications yet</h3>
          </div>
        )}

        {/* All Caught Up */}
        {notifications.length > 0 && unreadNotifications.length === 0 && !isLoading && !error && (
          <div className="py-6 px-4 text-center text-gray-500 text-sm">
            You're all caught up! No unread notifications.
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPage;