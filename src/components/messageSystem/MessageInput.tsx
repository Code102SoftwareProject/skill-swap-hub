"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

interface MessageInputProps {
  socket: Socket | null;
  chatRoomId: string;         // e.g. "67a74bf9166a1169f8d5700a"
  senderId: string;           // e.g. "67a6ff66cb5c199b45918b93"
  receiverId?: string;        // e.g. "67a6ff03cb5c199b45918b92" (if you need it)
}

export default function MessageInput({
  socket,
  chatRoomId,
  senderId,
  receiverId,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Typing indicator timer
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // ------------------------------------------------------------------
  // 1) Emit "typing" events so others see "User is typing..."
  // ------------------------------------------------------------------
  const handleTyping = () => {
    if (!socket) return;

    // Inform the server that the user started typing
    socket.emit("typing", {
      chatRoomId,
      userId: senderId, // or just "senderId" if your server uses that field
    });

    // Clear any previous timeout
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    // If user stops typing for 1.5s, emit "stop_typing"
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", {
        chatRoomId,
        userId: senderId,
      });
    }, 1500);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  // ------------------------------------------------------------------
  // 2) Send the message via Socket.IO + POST to /api/messages
  // ------------------------------------------------------------------
  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (!socket) return; // ensure socket is defined

    setLoading(true);

    // This object matches your API's required fields exactly:
    const newMsg = {
      chatRoomId,
      senderId,
      receiverId: receiverId || "", // if you must pass something; or handle undefined
      content: trimmed,
      sentAt: Date.now(),
    };

    // A) Real-time broadcast to everyone in the room
    socket.emit("send_message", newMsg);

    // B) Persist to DB (POST to  existing /api/messages)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMsg),
      });

      const data = await res.json();
      if (!data.success) {
        console.error("Failed to create message:", data.message);
      }
    } catch (error) {
      console.error("Error sending message to /api/messages:", error);
    }

    // Reset input
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
}
