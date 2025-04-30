"use client";

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
// Import parseISO along with formatDistanceToNow
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation'; // Import useRouter
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react'; // Using Lucide React for icons

interface ChatHeaderProps {
  chatRoomId: string;
  socket: Socket | null;
  userId: string; // current user id
}

// Define an interface for the user data fetched from the API

export default function ChatHeader({ chatRoomId, socket, userId }: ChatHeaderProps) {
  const [chatRoomInfo, setChatRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [otherUserName, setOtherUserName] = useState<string | null>(null); // State for other user's name
  const [otherUserId, setOtherUserId] = useState<string | null>(null); // State to store other user's ID
  const router = useRouter(); // Initialize the router

  // Fetch chat room info (e.g., room name, participants, etc.)
  useEffect(() => {
    async function fetchChatRoomInfo() {
      setLoading(true); // Start loading
      setOtherUserName(null); // Reset name on chat change
      setOtherUserId(null); // Reset other user ID
      setLastOnline(null); // Reset last online
      setIsOnline(false); // Reset online status
      try {
        const response = await fetch(`/api/chatrooms?chatRoomId=${chatRoomId}`);
        const data = await response.json();
        if (data.success && data.chatRooms && data.chatRooms.length > 0) {
          const roomInfo = data.chatRooms[0];
          setChatRoomInfo(roomInfo);
          // Find and set the other user's ID immediately after getting room info
          const foundOtherUserId = roomInfo.participants?.find((id: string) => id !== userId);
          if (foundOtherUserId) {
            setOtherUserId(foundOtherUserId);
          } else {
            console.log('Could not find other user ID in participants:', roomInfo.participants);
          }
        } else {
          console.error('Failed to fetch chat room info or room not found:', data.message);
          setChatRoomInfo(null); // Ensure chatRoomInfo is null if fetch fails
        }
      } catch (error) {
        console.error('Error fetching chat room info:', error);
        setChatRoomInfo(null); // Ensure chatRoomInfo is null on error
      } finally {
        setLoading(false);
      }
    }
    fetchChatRoomInfo();
  }, [chatRoomId, userId]); // Add userId dependency

  // Function to fetch the other user's name
  const fetchOtherUserName = async (id: string) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/users/profile?id=${id}`);
      const data = await response.json();
      if (data.success && data.user) {
        // Combine first and last name for display
        setOtherUserName(`${data.user.firstName} ${data.user.lastName}`);
      } else {
        console.error('Failed to fetch other user name:', data.message);
        setOtherUserName(null); // Reset if fetch fails
      }
    } catch (error) {
      console.error('Error fetching other user name:', error);
      setOtherUserName(null); // Reset on error
    }
  };

  // Move fetchLastOnline outside useEffect so it can be reused
  const fetchLastOnline = async (id: string) => {
    // Use the passed otherUserId directly
    if (!id) {
      console.log('No other user ID provided to fetchLastOnline');
      return;
    }

    console.log('Fetching last online for user ID:', id);

    try {
      const response = await fetch(`/api/onlinelog?userId=${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Last online response:', data); // Keep for debugging
      console.log('Raw lastOnline string:', data.data?.lastOnline); // Log raw string

      if (data.success && data.data?.lastOnline) {
        try {
          // Use parseISO for robust parsing
          const parsedDate = parseISO(data.data.lastOnline);
          console.log('Parsed Date object:', parsedDate); // Log parsed date

          // Check if the parsed date is valid before setting state
          if (!isNaN(parsedDate.getTime())) {
            setLastOnline(parsedDate);
          } else {
            console.error('Failed to parse date:', data.data.lastOnline);
            setLastOnline(null); // Set to null if parsing failed
          }
        } catch (parseError) {
          console.error('Error parsing date with parseISO:', parseError);
          setLastOnline(null); // Set to null on parsing error
        }
      } else {
        setLastOnline(null);
      }
    } catch (error: any) {
      console.error('error fetching last online:', error);
      setLastOnline(null);
    }
  };

  // Fetch user name and initial online/offline status when otherUserId is set
  useEffect(() => {
    if (otherUserId) {
      fetchOtherUserName(otherUserId);
      // Fetch initial last online status only if the user isn't immediately found online by socket
      // The socket listeners will handle subsequent updates.
      if (!isOnline) { // Check current state before potentially fetching
        fetchLastOnline(otherUserId);
      }
      // Request current online status via socket as well
      if (socket) {
        socket.emit("get_online_users");
      }
    }
    // Rerun primarily when the other user ID or the socket connection changes.
    // Live online/offline status changes are handled by the dedicated socket listeners below.
  }, [otherUserId, socket]); // Removed isOnline dependency

  // Modify the useEffect for online status
  useEffect(() => {
    if (!socket || !otherUserId) return; // Ensure socket and otherUserId are available

    // Request the current online users list when component mounts or socket/otherUserId changes
    socket.emit("get_online_users");

    const handleOnlineUsers = (users: string[]) => {
      // Check if the *specific* other user for this chat is in the list
      const isOtherUserOnline = users.includes(otherUserId);
      setIsOnline(isOtherUserOnline);
      // If the other user is specifically offline, fetch their last seen time
      if (!isOtherUserOnline) {
        fetchLastOnline(otherUserId);
      } else {
        setLastOnline(null); // Clear last seen if user is online
      }
    };

    const handleUserOnline = (data: { userId: string }) => {
      // Check if the user coming online is the *specific* other user for this chat
      if (data.userId === otherUserId) {
        setIsOnline(true);
        setLastOnline(null); // Clear last seen when user comes online
      }
    };

    const handleUserOffline = async (data: { userId: string }) => {
      // Check if the user going offline is the *specific* other user for this chat
      if (data.userId === otherUserId) {
        setIsOnline(false);
        // Fetch last seen immediately when the specific user goes offline
        await fetchLastOnline(otherUserId);
      }
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [socket, userId, otherUserId]); // Depend on socket, current userId, and the specific otherUserId

  // Listen for typing events from the specific other user
  useEffect(() => {
    if (!socket || !otherUserId) return; // Ensure socket and otherUserId are available

    const handleUserTyping = (data: { userId: string }) => {
      // Only react if the typing user is the other user in this chat
      if (data.userId === otherUserId) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: { userId: string }) => {
      // Only react if the stopping user is the other user in this chat
      if (data.userId === otherUserId) {
        setIsTyping(false);
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket, otherUserId]); // Depend on socket and the specific otherUserId

  // Removed the separate useEffect for initial fetchLastOnline as it's now handled
  // when otherUserId is set and the user isn't online.

  // Function to handle navigation back to the dashboard
  const handleBackToDashboard = () => {
    router.push('/dashboard'); // Navigate to the dashboard page
  };

  if (loading) {
    return <div className="p-4">Loading chat header...</div>;
  }

  // Check if chatRoomInfo or otherUserId failed to load
  if (!chatRoomInfo || !otherUserId) {
    return <div className="p-4">Chat room not found or participant missing.</div>;
  }

  // Add log here to see the value just before rendering
  console.log('Rendering ChatHeader - isOnline:', isOnline, 'lastOnline state:', lastOnline, 'Other User Name:', otherUserName);

  return (
    <header className="flex items-center justify-between p-4 bg-gray-50 border-b">
      <div>
        <h1 className="text-lg font-semibold">
          {/* Use the fetched name if available, otherwise fallback */}
          {otherUserName || `Chat with ${otherUserId.substring(0, 8)}`}
        </h1>
        <p className="text-sm text-gray-500">
          {isTyping ? 'Typing...' : (
            isOnline ? 'Online' : (
              // Ensure lastOnline is a valid Date object before formatting
              lastOnline instanceof Date && !isNaN(lastOnline.getTime())
                ? `Last seen ${formatDistanceToNow(lastOnline, { addSuffix: true })}`
                : 'Offline'
            )
          )}
        </p>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={handleBackToDashboard}
          className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mb-1" />
          <span className="text-xs">Dashboard</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
          onClick={() => console.log('Sessions clicked')}
        >
          <BookOpen className="h-5 w-5 mb-1" />
          <span className="text-xs">Sessions</span>
        </button>
        
        <button 
          className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors"
          onClick={() => console.log('Meetings clicked')}
        >
          <Calendar className="h-5 w-5 mb-1" />
          <span className="text-xs">Meetings</span>
        </button>
      </div>
    </header>
  );
}