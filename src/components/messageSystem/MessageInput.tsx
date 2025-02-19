"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

interface MessageInputProps {
  socket: Socket | null;
  chatRoomId: string;
  senderId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  socket,
  chatRoomId,
  senderId,
}) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Emit "typing" event
  const handleTyping = () => {
    if (!socket) return;

    // You used "typing" previously, so let's match your server’s code:
    socket.emit("typing", { chatRoomId, userId: senderId });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    // If the user stops typing for 1500 ms, emit "stop_typing"
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { chatRoomId, userId: senderId });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (!socket) return;

    setLoading(true);

    const newMsg = {
      chatRoomId,
      senderId,
      content: message.trim(),
      sentAt: Date.now(),
    };

    // 1) Real-time broadcast
    socket.emit("send_message", newMsg);

    // 2) Persist to DB
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg),
    });

    setMessage("");
    setLoading(false);
  };

  return (
    <div className="p-3 border-t bg-white">
      <div className="flex items-center space-x-2">
        <input
          className="flex-grow border p-2 rounded"
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
