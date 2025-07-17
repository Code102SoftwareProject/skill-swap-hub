"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSocket } from '@/lib/context/SocketContext';
import { Paperclip, X, CornerUpLeft } from "lucide-react";
import { IMessage } from "@/types/chat";

import { sendMessage as sendMessageService, fetchUserProfile } from "@/services/chatApiServices";
import { encryptMessage } from "@/lib/messageEncryption/encryption";

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
  // State for storing the reply sender's name
  const [replySenderName, setReplySenderName] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ! Focus on input when replying to a message
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // ! Fetch user profile for the message being replied to
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

  // ! Upload Files
  const uploadFile = async () => {
    if (!file) return;

    // Check file size (25MB = 25 * 1024 * 1024 bytes)
    const maxFileSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxFileSize) {
      setError("File size must be less than 25MB. Please choose a smaller file.");
      setTimeout(() => {
        setError(null);
      }, 5000);
      return;
    }

    setUploading(true);

    // ! Form Data for Api call
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
        
        // Determine content and whether to encrypt
        const messageContent = `File:${file?.name}:${result?.url || ""}`;
        const isFileLink = messageContent.startsWith('File:');
        const encryptedContent = isFileLink ? messageContent : encryptMessage(messageContent);

        // Send message with file URL
        const newMsg = {
          chatRoomId,
          senderId,
          receiverId: chatParticipants.find((id) => id !== senderId),
          content: encryptedContent, // Now sending encrypted content via socket
          sentAt: Date.now(),
          replyFor: replyingTo?._id || null,
        };

        // Send via socket immediately (now encrypted)
        socketSendMessage(newMsg);

        // Reset UI immediately
        setFile(null);
        setUploading(false);

        // Reset reply if onCancelReply exists
        if (onCancelReply) {
          onCancelReply();
        }

        // Save to database in background
        try {
          await sendMessageService(newMsg);
        } catch (error) {
          console.error("Error saving file message to database:", error);
        }
      } else {
        console.error("Upload failed:", result?.message || "Unknown error");
        setUploading(false);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
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
    // ! Need either one
    if (!fileUrl && !message.trim()) {
      setError("Please enter a message or select a file.");
      
      setTimeout(() => {
        setError(null);
      }, 5000);
      return;
    }
    if (!socket) return;

    setLoading(true);

    // Determine content and whether to encrypt
    const messageContent = fileUrl ? `File:${file?.name}:${fileUrl}` : message.trim();
    const isFileLink = messageContent.startsWith('File:');
    const encryptedContent = isFileLink ? messageContent : encryptMessage(messageContent);

    const newMsg = {
      chatRoomId,
      senderId,
      receiverId: chatParticipants.find((id) => id !== senderId),
      content: encryptedContent, // Now sending encrypted content via socket
      sentAt: Date.now(),
      replyFor: replyingTo?._id || null,
    };

    // Send via socket immediately (now encrypted)
    socketSendMessage(newMsg);

    // Reset UI immediately after socket send
    setMessage("");
    setFile(null);
    setLoading(false);

    // Reset reply if onCancelReply exists
    if (onCancelReply) {
      onCancelReply();
    }

    // Save to database in background (don't block UI)
    try {
      await sendMessageService(newMsg);
    } catch (error) {
      console.error("Error sending message:", error);
      // Optional: You could show a retry mechanism or error state here
      // For now, we'll just log the error since the message was sent via socket
    }
  };

  return (
    <div className="p-2 md:p-3 border-t bg-white">
      {/* Error message display */}
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {/* Reply Preview with user name */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-gray-100 rounded flex items-start font-body">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <CornerUpLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 flex-shrink-0" />
              <span className="text-xs md:text-sm font-semibold text-blue-600 truncate">
                Replying to {replySenderName}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-700 truncate">
              {replyingTo.content.startsWith("File:")
                ? "📎 File attachment"
                : replyingTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            aria-label="To remove reply select"
            className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center space-x-1 md:space-x-2">
        {file ? (
          <div className="flex items-center border p-2 rounded bg-gray-100 flex-1 min-w-0">
            <span className="mr-2 text-sm md:text-base truncate">{file.name}</span>
            <button
              onClick={removeFile}
              className="p-1 text-red-500 hover:text-red-700 flex-shrink-0"
              aria-label="Delete File Selected"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            className="flex-grow border p-2 rounded font-body text-sm md:text-base min-w-0"
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
          //aacept="image/*" // Only images
          className="hidden"
          aria-label="File Input"
        />
        <button
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || file !== null}
          aria-label="File Upload Paper Clip"
        >
          <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
        </button>
        <button
          className="bg-primary text-white px-2 py-1 md:px-3 md:py-1 rounded font-body text-sm md:text-base flex-shrink-0"
          onClick={() => (file ? uploadFile() : sendMessage())}
          disabled={loading || uploading}
        >
          {loading || uploading ? (
            <span className="hidden md:inline">Sending...</span>
          ) : (
            <span className="hidden md:inline">Send</span>
          )}
          {loading || uploading ? (
            <span className="md:hidden">...</span>
          ) : (
            <span className="md:hidden">Send</span>
          )}
        </button>
      </div>
    </div>
  );
}