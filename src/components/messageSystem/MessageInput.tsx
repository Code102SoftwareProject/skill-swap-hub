"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSocket } from '@/lib/context/SocketContext';
import { Paperclip, X, CornerUpLeft } from "lucide-react";
import { IMessage } from "@/types/chat";

import { sendMessage as sendMessageService, fetchUserProfile } from "@/services/chatApiServices";

interface MessageInputProps {
  chatRoomId: string;
  senderId: string;
  receiverId?: string;
  replyingTo?: IMessage | null;
  onCancelReply?: () => void;
  chatParticipants: string[];
}

export default function MessageInput({
  chatRoomId,
  senderId,
  replyingTo,
  onCancelReply,
  chatParticipants,
}: MessageInputProps) {
  const { socket, sendMessage: socketSendMessage, startTyping, stopTyping } = useSocket();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [replySenderName, setReplySenderName] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    const fetchReplyUserName = async () => {
      if (replyingTo && replyingTo.senderId) {
        if (replyingTo.senderId === senderId) {
          setReplySenderName("yourself");
        } else {
          const userProfile = await fetchUserProfile(replyingTo.senderId);
          if (userProfile) {
            setReplySenderName(`${userProfile.firstName} ${userProfile.lastName}`);
          } else {
            setReplySenderName("Unknown User");
          }
        }
      }
    };

    fetchReplyUserName();
  }, [replyingTo, senderId]);

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
    formData.append("folder", "chat"); 

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
    startTyping(chatRoomId);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      stopTyping(chatRoomId);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  const sendMessage = async (fileUrl: string = "") => {
    if (!fileUrl && !message.trim()){
      setError("Please enter a message or select a file.");
      
      setTimeout(()=>{
        setError(null);
      },5000)
      return;
    }
    if (!socket) return;

    setLoading(true);

    const newMsg = {
      chatRoomId,
      senderId,
      receiverId: chatParticipants.find((id) => id !== senderId),
      content: fileUrl ? `File:${file?.name}:${fileUrl}` : message.trim(),
      sentAt: Date.now(),
      replyFor: replyingTo?._id || null,
    };

    socketSendMessage(newMsg);

    try {
      await sendMessageService(newMsg);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setMessage("");
    setFile(null);
    setLoading(false);

    if (onCancelReply) {
      onCancelReply();
    }
  };

  return (
    <div className="p-2 sm:p-3 border-t bg-white">
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-xs sm:text-sm">
          {error}
        </div>
      )}
      
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-gray-100 rounded flex items-start font-body">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <CornerUpLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-600 truncate">
                Replying to {replySenderName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 truncate">
              {replyingTo.content.startsWith("File:")
                ? "📎 File attachment"
                : replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0 p-0.5"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center space-x-1 sm:space-x-2">
        {file ? (
          <div className="flex items-center border p-2 rounded bg-gray-100 flex-1 min-w-0">
            <span className="mr-2 truncate text-xs sm:text-sm">{file.name}</span>
            <button
              onClick={removeFile}
              className="p-0.5 sm:p-1 text-red-500 hover:text-red-700 flex-shrink-0"
              aria-label="Remove file"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            className="flex-1 border p-2 rounded font-body text-sm md:text-base min-w-0"
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
          className="p-1.5 sm:p-2 bg-gray-200 rounded-full hover:bg-gray-300 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || file !== null}
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </button>
        
        <button
          className="bg-primary text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded font-body text-xs sm:text-sm md:text-base flex-shrink-0"
          onClick={() => (file ? uploadFile() : sendMessage())}
          disabled={loading || uploading}
        >
          {loading || uploading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}