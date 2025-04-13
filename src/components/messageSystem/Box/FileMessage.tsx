"use client";

import React, { useEffect } from "react";
import { Download } from "lucide-react";

/**
 * FileMessage component
 * @param fileInfo - String containing file information with format "File:{fileName}:{fileUrl}" 
 * @description A component to display file info and download button
 */
const FileMessage = ({ fileInfo }: { fileInfo: string }) => {
  // Parse file info in a more robust way
  const content = fileInfo.substring(5); // Remove "File:" prefix

  // Extract fileName and fileUrl more safely
  let fileName, fileUrl;

  // If the content contains a URL (checking for http:// or https://)
  const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    fileUrl = urlMatch[0];
    // Get fileName from everything before the URL
    const parts = content.split(urlMatch[0]);
    fileName = parts[0].trim().replace(/^:|:$/g, '');
    // If no filename found, extract it from the URL
    if (!fileName) {
      const urlParts = fileUrl.split('/');
      fileName = urlParts[urlParts.length - 1];
    }
  } else {
    // If no URL found, the whole content is the filename
    fileName = content.split(':')[0];
    fileUrl = null;
  }

  const fileExt = fileName.split('.').pop()?.toLowerCase();

  useEffect(() => {
    console.log("File Name:", fileName);
    console.log("File URL:", fileUrl);
  }, []);

  const apiParam = fileUrl
    ? `fileUrl=${encodeURIComponent(fileUrl)}`
    : `file=${encodeURIComponent(fileName)}`;

  return (
    <div className="file-message flex flex-col w-64">
      <div className="file-info flex items-center gap-2 mb-1">
        {/* File icon */}
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium w-full">{fileName}</span>
      </div>

      {/* Download / View button */}
      <a
        href={`/api/file/retrieve?${apiParam}`}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="text-s py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded self-start flex w-full justify-center"
      >
        <Download className="w-5 h-5 mr-2" />
        Download
      </a>
    </div>
  );
};

export default FileMessage;