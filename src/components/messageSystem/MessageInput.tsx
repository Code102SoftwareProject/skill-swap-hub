"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // Connect to socket server

interface MessageInputProps {
  chatRoomId: string;
  senderId: string;
  receiverId: string;
  onMessageSent?: (newMessage: any) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ chatRoomId, senderId, receiverId, onMessageSent }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!receiverId || receiverId === "unknown") {
      console.warn("⚠️ Cannot send message: receiverId is missing!");
      return;
    }

    setLoading(true);

    try {
      let fileUrl = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/file/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.url) {
          fileUrl = uploadData.url;
        } else {
          console.error("❌ File upload failed:", uploadData.message);
          setLoading(false);
          return;
        }
      }

      const newMsg = {
        chatRoomId,
        senderId,
        receiverId,
        content: fileUrl || message,
        sentAt: Date.now().toString(),
        isFile: !!fileUrl,
      };

      // ✅ Emit message via socket for real-time updates
      socket.emit("send_message", newMsg);

      // ✅ Save message to database
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("");
        setSelectedFile(null);
        setFilePreview(null);
        onMessageSent?.(data.message); // Update UI
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
    <div className="flex flex-col p-3 border-t bg-white">
      {filePreview && (
        <div className="flex items-center mb-2 p-2 border rounded-lg bg-gray-100">
          <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-md mr-3" />
          <p className="text-sm text-gray-700">{selectedFile?.name}</p>
          <button className="ml-auto text-red-500" onClick={() => { setSelectedFile(null); setFilePreview(null); }}>✖</button>
        </div>
      )}

      <div className="flex items-center">
        <button className="p-2 mr-2" type="button" aria-label="Add">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <input
          type="text"
          className="flex-grow p-2 border rounded-lg outline-none"
          placeholder={receiverId === "unknown" ? "Waiting for chat details..." : "Type a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading || receiverId === "unknown"}
        />

        <label className="p-2 mx-2 cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                setSelectedFile(file);
                setFilePreview(URL.createObjectURL(file));
              }
            }}
          />
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.414 6.414a2 2 0 000 2.828 2 2 0 002.828 0L18 10" />
          </svg>
        </label>

        <button className="p-2 bg-blue-600 text-white rounded-lg" onClick={sendMessage} disabled={loading || receiverId === "unknown"}>
          {loading ? "Sending..." : "➤"}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
