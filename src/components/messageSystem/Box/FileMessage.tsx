"use client";

import React from "react";
import { Download } from "lucide-react";

interface FileMessageProps {
  fileInfo: string; // Format: "File:filename.ext:url"
}

export default function FileMessage({ fileInfo }: FileMessageProps) {
  // Parse the file info string
  const parseFileInfo = () => {
    try {
      // Remove "File:" prefix
      const withoutPrefix = fileInfo.substring(5);
      // Find the next colon which separates filename from URL
      const colonIndex = withoutPrefix.indexOf(":");
      
      if (colonIndex > 0) {
        const fileName = withoutPrefix.substring(0, colonIndex);
        const fileUrl = withoutPrefix.substring(colonIndex + 1);
        return { fileName, fileUrl };
      }
      return { fileName: "Unknown file", fileUrl: "" };
    } catch (error) {
      console.error("Error parsing file info:", error);
      return { fileName: "Unknown file", fileUrl: "" };
    }
  };

  const { fileName, fileUrl } = parseFileInfo();

  // Handle file download
  const handleDownload = () => {
    try {
      // Pass the ENTIRE fileInfo string to let the backend parse it correctly
      const downloadUrl = `/api/file/retrieve?fileContent=${encodeURIComponent(fileInfo)}`;
      
      // Create a hidden link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName; // Set the suggested filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  return (
    <div className="file-message flex items-center gap-2">
      {/* File icon */}
      <div className="file-icon p-2 bg-gray-100 rounded-md">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {/* File name and download button */}
      <div className="flex-1">
        <div className="text-sm font-medium truncate" title={fileName}>
          {fileName}
        </div>
      </div>
      
      <button 
        onClick={handleDownload}
        className="download-button p-1 text-blue-600 hover:text-blue-800"
        title="Download file"
      >
        <Download size={18} />
      </button>
    </div>
  );
}