'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { updateLastSeen } from '@/services/chatApiServices';

// Type 
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
  refreshOnlineUsers: () => void; // Add function to manually refresh online users
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

  // Track the previous userId with a ref to prevent unnecessary reconnections
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // Initialize socket connection
  useEffect(() => {
    // Don't do anything if userId is not available
    if (!userId) return;

    // Skip if we already have a connection for this user
    if (socket && prevUserIdRef.current === userId && isConnected) return;

    // Update reference
    prevUserIdRef.current = userId;

    // Update user's last seen status
    updateLastSeen(userId).catch(console.error);

    // Create socket connection
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET;
    const newSocket = io(SOCKET_URL, { transports: ['websocket'] });

    // Important: Set socket state only once
    setSocket(newSocket);

    // Set up event handlers for this socket instance
    const setupSocketEvents = () => {
      newSocket.on('connect', () => {
        //console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        newSocket.emit('presence_online', { userId });
        newSocket.emit('get_online_users');
      });

      newSocket.on('disconnect', () => {
        //console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('online_users', (users: string[]) => {
        //console.log('Received online users:', users);
        setOnlineUsers(users);
      });

      newSocket.on('user_online', ({ userId: onlineUserId }) => {
        //console.log('User came online:', onlineUserId);
        setOnlineUsers(prev => {
          if (prev.includes(onlineUserId)) return prev;
          return [...prev, onlineUserId];
        });
        
        // Emit event to update delivery status of pending messages for this user
        newSocket.emit('user_came_online', { userId: onlineUserId });
      });

      newSocket.on('user_offline', ({ userId: offlineUserId }) => {
        //console.log('User went offline:', offlineUserId);
        setOnlineUsers(prev => prev.filter(id => id !== offlineUserId));
      });

      // Listen for delivery status updates
      newSocket.on('message_delivery_update', (data) => {
        // This will be handled by individual chat components
        //console.log('Delivery status update:', data);
      });

      newSocket.on('receive_notification', (notification) => {
        //console.log('Received notification:', notification);
      });
    };

    // Set up the events
    setupSocketEvents();

    // Browser close handler
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/onlinelog', JSON.stringify({ userId }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up on unmount or when userId changes
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (newSocket) {
        // Make sure to remove ALL event listeners
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('online_users');
        newSocket.off('user_online');
        newSocket.off('user_offline');
        newSocket.off('receive_notification');

        if (userId) {
          updateLastSeen(userId)
            .then(() => {
              newSocket.disconnect();
            })
            .catch(console.error);
        } else {
          newSocket.disconnect();
        }
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
      
      // Check if recipient is online and mark as delivered immediately
      const recipientId = messageData.recipientId || messageData.chatRoomId; // Adjust based on your message structure
      if (recipientId && onlineUsers.includes(recipientId)) {
        // Emit delivery status update
        setTimeout(() => {
          socket.emit('message_delivered', {
            messageId: messageData.messageId || messageData._id,
            chatRoomId: messageData.chatRoomId,
            recipientId: recipientId
          });
        }, 100); // Small delay to ensure message is processed
      }
    }
  };

  // Send a notification
  const sendNotification = (notification: NotificationData) => {
    if (socket) {
      socket.emit('notification', notification);
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

  // Manually refresh online users list
  const refreshOnlineUsers = () => {
    if (socket && isConnected) {
      socket.emit('get_online_users');
    }
  };

  // Mark message as read and notify sender
  const markMessageAsRead = (messageId: string, chatRoomId: string, senderId: string) => {
    if (socket && userId) {
      socket.emit("message_read", { 
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
    markMessageAsRead,
    refreshOnlineUsers
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

// hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};