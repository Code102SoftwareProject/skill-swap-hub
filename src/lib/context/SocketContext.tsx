'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { updateLastSeen } from '@/services/chatApiServices';

// Type definitions for socket context
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  joinRoom: (chatRoomId: string) => void;
  leaveRoom: (chatRoomId: string) => void;
  sendMessage: (messageData: any) => void;
  sendNotification: (notification: NotificationData) => void;
  startTyping: (chatRoomId: string) => void;
  stopTyping: (chatRoomId: string) => void;
  markMessageAsRead: (messageId: string, chatRoomId: string, senderId: string) => void;
}

interface NotificationData {
  userId?: string;
  type: string;
  description: string;
  targetDestination?: string | null;
  broadcast?: boolean;
  [key: string]: any;
}

// Create the context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Socket provider component
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();
  const userId = user?._id;

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;

    // Update user's last seen status
    updateLastSeen(userId).catch(console.error);

    // Create socket connection
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET || 'https://valuable-iona-arlogic-b975dfc8.koyeb.app/';
    const newSocket = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    // Set up socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('presence_online', { userId });
      newSocket.emit('get_online_users');
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('online_users', (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('user_online', ({ userId: onlineUserId }) => {
      setOnlineUsers(prev => 
        prev.includes(onlineUserId) ? prev : [...prev, onlineUserId]
      );
    });

    newSocket.on('user_offline', ({ userId: offlineUserId }) => {
      setOnlineUsers(prev => prev.filter(id => id !== offlineUserId));
    });

    // Browser close handler
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/onlinelog', JSON.stringify({ userId }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (userId) {
        updateLastSeen(userId)
          .then(() => {
            if (newSocket) {
              newSocket.disconnect();
            }
          })
          .catch(console.error);
      }
    };
  }, [userId]);

  // Join a chat room
  const joinRoom = (chatRoomId: string) => {
    if (socket && userId) {
      socket.emit('join_room', { chatRoomId, userId });
    }
  };

  // Leave a chat room
  const leaveRoom = (chatRoomId: string) => {
    if (socket && userId) {
      socket.emit('leave_room', { chatRoomId, userId });
    }
  };

  // Send a message
  const sendMessage = (messageData: any) => {
    if (socket) {
      socket.emit('send_message', messageData);
    }
  };

  // Send a notification
  const sendNotification = (notification: NotificationData) => {
    if (socket) {
      socket.emit('send_notification', notification);
    }
  };

  // Signal user is typing
  const startTyping = (chatRoomId: string) => {
    if (socket && userId) {
      socket.emit('typing', { chatRoomId, userId });
    }
  };

  // Signal user stopped typing
  const stopTyping = (chatRoomId: string) => {
    if (socket && userId) {
      socket.emit('stop_typing', { chatRoomId, userId });
    }
  };

  // Mark message as read
  const markMessageAsRead = (messageId: string, chatRoomId: string, senderId: string) => {
    if (socket && userId) {
      socket.emit('message_read', {
        messageId,
        chatRoomId,
        readerId: userId,
        senderId
      });
    }
  };

  // Context value
  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendNotification,
    startTyping,
    stopTyping,
    markMessageAsRead
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};