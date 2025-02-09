import { useEffect, useState } from "react";
import Link from "next/link";

const Sidebar = ({ userId }) => {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/chatrooms?userId=${userId}`);
        const data = await response.json();
        if (data.success) {
          setChatRooms(data.chatRooms);
        }
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchChatRooms();
    }
  }, [userId]);

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Chats</h2>
      {loading ? (
        <p>Loading chats...</p>
      ) : (
        <ul>
          {chatRooms.map((chat) => {
            const otherParticipant = chat.participants.find((id) => id !== userId);
            return (
              <li key={chat._id} className="mb-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                <Link href={`/chat/${chat._id}`} className="flex items-center space-x-2">
                  {/* TODO: Add user photo here */}
                  <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                  <span className="text-white">User {otherParticipant}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;
