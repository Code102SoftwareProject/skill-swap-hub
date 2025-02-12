"use client";
import { useState } from "react";
import { Button } from "../ui/button";

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

      // If a file is selected, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.url) {
          fileUrl = uploadData.url;
          console.log("✅ File uploaded successfully:", fileUrl);
        } else {
          console.error("❌ File upload failed:", uploadData.message);
          setLoading(false);
          return;
        }
      }

      // Send message (either text or file URL)
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatRoomId,
          senderId,
          receiverId,
          content: fileUrl || message, // Send either message text or file URL
          isFile: !!fileUrl, // Indicate if the message is a file
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(""); // Clear input field
        setSelectedFile(null); // Clear selected file
        setFilePreview(null); // Clear file preview
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
    <div className="flex flex-col p-3 border-t bg-white">
      {/* File Preview (WhatsApp-like) */}
      {filePreview && (
        <div className="flex items-center mb-2 p-2 border rounded-lg bg-gray-100">
          <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-md mr-3" />
          <p className="text-sm text-gray-700">{selectedFile?.name}</p>
          <button className="ml-auto text-red-500" onClick={() => { setSelectedFile(null); setFilePreview(null); }}>✖</button>
        </div>
      )}

      <div className="flex items-center">
        {/* Plus Button (No Action Yet) */}
        <button className="p-2 mr-2" type="button" aria-label="Add">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Message Input */}
        <input
          type="text"
          className="flex-grow p-2 border rounded-lg outline-none"
          placeholder={receiverId === "unknown" ? "Waiting for chat details..." : "Type a message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading || receiverId === "unknown"}
        />

        {/* File Upload Button */}
        <label className="p-2 mx-2 cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                setSelectedFile(file);
                setFilePreview(URL.createObjectURL(file)); // Show preview
              }
            }}
          />
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.414 6.414a2 2 0 000 2.828 
                                                                 2 2 0 002.828 0L18 10" />
          </svg>
        </label>

        {/* Send Button */}
        <button
          className="p-2 bg-blue-600 text-white rounded-lg"
          onClick={sendMessage}
          disabled={loading || receiverId === "unknown"}
        >
          {loading ? "Sending..." : "➤"}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
