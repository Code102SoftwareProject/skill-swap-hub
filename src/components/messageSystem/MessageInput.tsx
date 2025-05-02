"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { Paperclip, X, CornerUpLeft } from "lucide-react";
import { IMessage } from "@/types/chat";
// Import the API service
import { sendMessage as sendMessageService } from "@/services/chatApiServices";

interface MessageInputProps {
  socket: Socket | null;
  chatRoomId: string;
  senderId: string;
  receiverId?: string;
  replyingTo?: IMessage | null;
  onCancelReply?: () => void;
  chatParticipants: string[];
}

export default function MessageInput({
  socket,
  chatRoomId,
  senderId,
  receiverId,
  replyingTo,
  onCancelReply,
  chatParticipants,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus on input when replying to a message
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

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
    formData.append("folder", "chat"); // Add folder parameter

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
      receiverId: chatParticipants.find((id) => id !== senderId), // Determine the other user in the chat
      content: fileUrl ? `File:${file?.name}:${fileUrl}` : message.trim(),
      sentAt: Date.now(),
      // Fix: Send just the message ID instead of the entire message object
      replyFor: replyingTo?._id || null,
    };

    socket.emit("send_message", newMsg);

    try {
      await sendMessageService(newMsg);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setMessage("");
    setFile(null);
    setLoading(false);

    // Reset reply if onCancelReply exists
    if (onCancelReply) {
      onCancelReply();
    }
  };

  return (
    <div className="p-3 border-t bg-white">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-gray-100 rounded flex items-start">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <CornerUpLeft className="w-3 h-3 mr-1" />
              <span className="text-xs font-semibold text-blue-600">
                Replying to{" "}
                {replyingTo.senderId === senderId ? "yourself" : replyingTo.senderId}
              </span>
            </div>
            <p className="text-sm text-gray-700 truncate">
              {replyingTo.content.startsWith("File:")
                ? "📎 File attachment"
                : replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            aria-label="To remove reply select"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        {file ? (
          <div className="flex items-center border p-2 rounded bg-gray-100">
            <span className="mr-2">{file.name}</span>
            <button
              onClick={removeFile}
              className="p-1 text-red-500 hover:text-red-700"
              aria-label="Delete File Selected"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            className="flex-grow border p-2 rounded"
            type="text"
            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
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
          aria-label="File Input"
        />
        <button
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || file !== null}
          aria-label="File Upload Paper Clip"
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