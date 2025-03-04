"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { Paperclip, X } from "lucide-react";

interface MessageInputProps {
  socket: Socket | null;
  chatRoomId: string;
  senderId: string;
  receiverId?: string;
}

export default function MessageInput({
  socket,
  chatRoomId,
  senderId,
  receiverId,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setMessage("");
  };

  const removeFile = () => {
    setFile(null);
    setMessage("");
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/file/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setFileUrl(result?.url || null);
        sendMessage(result?.url || "");
      } else {
        console.error("Upload failed:", result?.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit("typing", { chatRoomId, userId: senderId });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { chatRoomId, userId: senderId });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  const sendMessage = async (fileUrl: string = "") => {
    if (!fileUrl && !message.trim()) return;
    if (!socket) return;

    setLoading(true);

    const newMsg = {
      chatRoomId,
      senderId,
      receiverId: receiverId || "",
      content: fileUrl ? `File: ${fileUrl}` : message.trim(),
      sentAt: Date.now(),
    };

    socket.emit("send_message", newMsg);

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setMessage("");
    setFile(null);
    setLoading(false);
  };

  return (
    <div className="p-3 border-t bg-white">
      <div className="flex items-center space-x-2">
        {file ? (
          <div className="flex items-center border p-2 rounded bg-gray-100">
            <span className="mr-2">{file.name}</span>
            <button onClick={removeFile} className="p-1 text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <input
            className="flex-grow border p-2 rounded"
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            disabled={loading || file !== null}
          />
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <button
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || file !== null}
        >
          <Paperclip className="w-5 h-5 text-gray-600" />
        </button>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => (file ? uploadFile() : sendMessage())}
          disabled={loading || uploading}
        >
          {loading || uploading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
