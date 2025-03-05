"use client";

import { useState } from "react";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const uploadFile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file!");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/file/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`File uploaded successfully!`);
        setImageUrl(result?.url || null);
      } else {
        setMessage("Upload failed: " + (result?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("Upload error: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <form onSubmit={uploadFile}>
        <input type="file" onChange={handleFileChange} accept="image/*" />
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {message && <p>{message}</p>}
      {imageUrl && (
        <div>
          <p>Uploaded Image:</p>
          <img src={imageUrl} alt="Uploaded file" width="300" />
        </div>
      )}
    </div>
  );
}
