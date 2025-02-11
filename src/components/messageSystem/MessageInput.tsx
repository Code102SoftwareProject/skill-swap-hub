"use client";
import { useState } from "react";

interface MessageInputProps {
  chatRoomId: string;
  senderId: string;
  receiverId: string;
  onMessageSent?: (newMessage: any) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ chatRoomId, senderId, receiverId, onMessageSent }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (!receiverId || receiverId === "unknown") {
      console.warn("⚠️ Cannot send message: receiverId is missing!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatRoomId,
          senderId,
          receiverId,
          content: message,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(""); // Clear input field
        onMessageSent?.(data.message); // ✅ Update UI instantly
      } else {
        console.error("Failed to send message:", data.message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center p-3 border-t bg-white">
      <input
        type="text"
        className="flex-grow p-2 border rounded-lg outline-none"
        placeholder={receiverId === "unknown" ? "Waiting for chat details..." : "Type a message..."}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading || receiverId === "unknown"}
      />
      <button
        className="p-2 bg-blue-600 text-white rounded-lg ml-2 disabled:opacity-50"
        onClick={sendMessage}
        disabled={loading || receiverId === "unknown"}
      >
        {loading ? "Sending..." : "➤"}
      </button>
    </div>
  );
};

export default MessageInput;
