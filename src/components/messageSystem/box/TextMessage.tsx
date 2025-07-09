"use client";
import React from "react";

interface TextMessageProps {
  content: string;
  sentAt?: string | Date;
  isMine?: boolean;
}

/**
 * TextMessage component
 * @param content - The text content of the message
 * @param sentAt - Timestamp when message was sent
 * @param isMine - Whether the message belongs to current user
 * @description A component to display regular text messages with timestamp
 */
const TextMessage = ({ content, sentAt, isMine = false }: TextMessageProps) => {
  return (
    <div className="flex flex-col">
      {/* Message bubble */}
      <span className="block font-body">{content}</span>
      
      {/* Timestamp */}
      <div className="flex justify-end items-center mt-1">
        <div className={`text-xs text-[10px] ${isMine ? "text-black/80" : "text-gray-500"}`}>
          {sentAt
            ? new Date(sentAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </div>
      </div>
    </div>
  );
};

export default TextMessage;